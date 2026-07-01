-- ============================================================
-- Correção de séries de lançamentos: parcelados e recorrentes
-- Aplique este SQL no console do banco (Lovable Cloud > SQL Editor)
-- ============================================================

-- 1) Índice único parcial que bloqueia duplicatas (mesmo grupo, mesma data)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lanc_grupo_data_unico
  ON public.lancamentos (empresa_id, recorrencia_grupo_id, data_vencimento)
  WHERE recorrencia_grupo_id IS NOT NULL;

-- 2) Função de backfill: preenche parcelas/recorrências faltantes
CREATE OR REPLACE FUNCTION public.backfill_series(_empresa_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hoje date := CURRENT_DATE;
  limite date := CURRENT_DATE + INTERVAL '12 months';
  created integer := 0;
  grp record;
  cur date;
  step interval;
  base_desc text;
  new_valor numeric;
BEGIN
  -- ============ RECORRENTES ABERTAS ============
  FOR grp IN
    SELECT recorrencia_grupo_id,
           MIN(data_vencimento) AS primeira,
           MAX(data_vencimento) AS ultima,
           MAX(recorrencia_fim) AS fim,
           (array_agg(recorrencia_tipo ORDER BY data_vencimento))[1] AS tipo,
           (array_agg(descricao ORDER BY data_vencimento))[1] AS descricao,
           (array_agg(valor ORDER BY data_vencimento))[1] AS valor,
           (array_agg(tipo ORDER BY data_vencimento))[1] AS lancamento_tipo,
           (array_agg(categoria_id ORDER BY data_vencimento))[1] AS categoria_id,
           (array_agg(fornecedor_id ORDER BY data_vencimento))[1] AS fornecedor_id,
           (array_agg(cliente_id ORDER BY data_vencimento))[1] AS cliente_id,
           (array_agg(conta_bancaria_id ORDER BY data_vencimento))[1] AS conta_bancaria_id,
           (array_agg(forma_pagamento_id ORDER BY data_vencimento))[1] AS forma_pagamento_id,
           (array_agg(projeto_id ORDER BY data_vencimento))[1] AS projeto_id
    FROM public.lancamentos
    WHERE empresa_id = _empresa_id
      AND recorrente = true
      AND total_parcelas IS NULL
      AND recorrencia_grupo_id IS NOT NULL
    GROUP BY recorrencia_grupo_id
  LOOP
    IF grp.fim IS NOT NULL AND grp.fim < hoje THEN CONTINUE; END IF;

    step := CASE grp.tipo
      WHEN 'semanal' THEN INTERVAL '7 days'
      WHEN 'quinzenal' THEN INTERVAL '15 days'
      WHEN 'trimestral' THEN INTERVAL '3 months'
      WHEN 'anual' THEN INTERVAL '1 year'
      ELSE INTERVAL '1 month'
    END;

    cur := grp.primeira + step;
    WHILE cur <= LEAST(limite, COALESCE(grp.fim, limite)) LOOP
      BEGIN
        INSERT INTO public.lancamentos (
          empresa_id, descricao, valor, tipo, status, data_vencimento,
          categoria_id, fornecedor_id, cliente_id, conta_bancaria_id,
          forma_pagamento_id, projeto_id, recorrente, recorrencia_tipo,
          recorrencia_fim, recorrencia_grupo_id
        ) VALUES (
          _empresa_id, grp.descricao, grp.valor, grp.lancamento_tipo, 'pendente', cur,
          grp.categoria_id, grp.fornecedor_id, grp.cliente_id, grp.conta_bancaria_id,
          grp.forma_pagamento_id, grp.projeto_id, true, grp.tipo,
          grp.fim, grp.recorrencia_grupo_id
        );
        created := created + 1;
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
      cur := cur + step;
    END LOOP;
  END LOOP;

  -- ============ PARCELADAS INCOMPLETAS ============
  FOR grp IN
    SELECT recorrencia_grupo_id,
           MIN(data_vencimento) AS primeira,
           COUNT(*)::int AS existentes,
           MAX(total_parcelas) AS total,
           (array_agg(descricao ORDER BY data_vencimento))[1] AS descricao,
           (array_agg(valor ORDER BY data_vencimento))[1] AS valor,
           (array_agg(tipo ORDER BY data_vencimento))[1] AS lancamento_tipo,
           (array_agg(categoria_id ORDER BY data_vencimento))[1] AS categoria_id,
           (array_agg(fornecedor_id ORDER BY data_vencimento))[1] AS fornecedor_id,
           (array_agg(cliente_id ORDER BY data_vencimento))[1] AS cliente_id,
           (array_agg(conta_bancaria_id ORDER BY data_vencimento))[1] AS conta_bancaria_id,
           (array_agg(forma_pagamento_id ORDER BY data_vencimento))[1] AS forma_pagamento_id,
           (array_agg(projeto_id ORDER BY data_vencimento))[1] AS projeto_id
    FROM public.lancamentos
    WHERE empresa_id = _empresa_id
      AND recorrente = false
      AND total_parcelas > 1
      AND recorrencia_grupo_id IS NOT NULL
    GROUP BY recorrencia_grupo_id
    HAVING COUNT(*) < MAX(total_parcelas)
  LOOP
    base_desc := regexp_replace(grp.descricao, '\s*\(\d+/\d+\)$', '');
    new_valor := grp.valor;

    FOR i IN grp.existentes..(grp.total - 1) LOOP
      BEGIN
        INSERT INTO public.lancamentos (
          empresa_id, descricao, valor, tipo, status, data_vencimento,
          categoria_id, fornecedor_id, cliente_id, conta_bancaria_id,
          forma_pagamento_id, projeto_id, recorrente, total_parcelas,
          parcela_atual, recorrencia_grupo_id
        ) VALUES (
          _empresa_id,
          base_desc || ' (' || (i + 1) || '/' || grp.total || ')',
          new_valor, grp.lancamento_tipo, 'pendente',
          (grp.primeira + (i * INTERVAL '1 month'))::date,
          grp.categoria_id, grp.fornecedor_id, grp.cliente_id, grp.conta_bancaria_id,
          grp.forma_pagamento_id, grp.projeto_id, false, grp.total,
          i + 1, grp.recorrencia_grupo_id
        );
        created := created + 1;
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
    END LOOP;
  END LOOP;

  RETURN created;
END;
$$;

-- 3) Trigger: dispara backfill após inserir novo lançamento da série
CREATE OR REPLACE FUNCTION public.trg_backfill_series()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só dispara para o "gatilho" da série (parcela 1 OU primeiro recorrente do grupo)
  IF (NEW.total_parcelas IS NOT NULL AND NEW.total_parcelas > 1 AND COALESCE(NEW.parcela_atual, 1) = 1)
     OR (NEW.recorrente = true) THEN
    PERFORM public.backfill_series(NEW.empresa_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_insert_lancamento_series ON public.lancamentos;
CREATE TRIGGER after_insert_lancamento_series
AFTER INSERT ON public.lancamentos
FOR EACH ROW
EXECUTE FUNCTION public.trg_backfill_series();

-- 4) Backfill imediato para todas as empresas existentes
DO $$
DECLARE e record;
BEGIN
  FOR e IN SELECT id FROM public.empresas LOOP
    PERFORM public.backfill_series(e.id);
  END LOOP;
END$$;

-- 5) (Opcional) cron diário — executa às 06:00 UTC ≈ 03:00 BRT
-- Requer pg_cron habilitado.
-- SELECT cron.schedule(
--   'backfill-lancamentos-series-diario',
--   '0 6 * * *',
--   $$ SELECT public.backfill_series(id) FROM public.empresas; $$
-- );
