
import React from "react";
import { formatCurrency } from "@/utils/formatters";

interface CategoryDataTableProps {
  data: {name: string; value: number}[];
  colors: string[];
}

const CategoryDataTable: React.FC<CategoryDataTableProps> = ({ data, colors }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (data.length === 0) {
    return null;
  }
  
  return (
    <div className="rounded-md border">
      <table className="w-full table-auto">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left">Categoria</th>
            <th className="px-4 py-2 text-right">Valor</th>
            <th className="px-4 py-2 text-right">Percentual</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-t hover:bg-muted/50">
              <td className="px-4 py-2 flex items-center">
                <div 
                  className="mr-2 h-3 w-3 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                {item.name}
              </td>
              <td className="px-4 py-2 text-right">
                {formatCurrency(item.value)}
              </td>
              <td className="px-4 py-2 text-right">
                {(item.value / total * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
          <tr className="border-t font-medium">
            <td className="px-4 py-2">Total</td>
            <td className="px-4 py-2 text-right">
              {formatCurrency(total)}
            </td>
            <td className="px-4 py-2 text-right">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CategoryDataTable;
