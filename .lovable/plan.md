I will implement a temporary storage system for AI-extracted document data to allow users to review and import at their convenience.

### Database Changes
- Create a new table `importacoes_temporarias` to store extracted data.
- Fields: `id`, `empresa_id`, `usuario_id`, `nome_arquivo`, `dados` (JSONB containing the extracted items), `resumo`, `modelo_ia`, `status` (pendente, importado, cancelado), and timestamps.
- Enable RLS and add policies so users can only see and manage their own company's temporary imports.

### Frontend Changes
- **Component Level**: Create `src/components/importacao/ImportacoesPendentes.tsx` to list and manage these temporary records.
- **Page Level**: Update `src/pages/ImportarDocumentos.tsx` to:
    - Save extracted data to the temporary table after IA analysis.
    - Provide a way to view "Pending Imports" (a list of previous analyses).
    - Allow loading a pending import back into the editor or deleting it.

### Technical Details
- Use a new migration for the table.
- Update `ImportarDocumentos.tsx` state management to handle loading from DB.
- The `dados` field in JSONB will store the `ExtractedItem[]` array.

---

### Progress Note
- I'll verify the schema doesn't have `empresa_id` in some tables (noticed `empresa_id` missing in the 20260214 migration but present in the edge function logic, implying it was added in a later migration or the edge function handles a multi-tenant structure I should follow).
- Actually, looking at the edge function `process-document-import`, it fetches `empresa_id` from `perfis`. I will ensure the new table has `empresa_id` for proper multi-tenancy.
