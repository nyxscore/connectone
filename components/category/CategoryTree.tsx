"use client";

export default function CategoryTree({
  node,
  onFinalSelect,
}: {
  node: any;
  onFinalSelect: (cat: any) => void;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-2">{node.name}</h3>
      {node.children ? (
        <ul className="space-y-2">
          {node.children.map((child: any) => (
            <li key={child.id}>
              <button
                type="button"
                className="px-3 py-2 rounded hover:bg-gray-100 w-full text-left"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("CategoryTree: child 선택됨", child);
                  onFinalSelect(child);
                }}
              >
                {child.name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            console.log("CategoryTree: node 선택됨", node);
            onFinalSelect(node);
          }}
        >
          {node.name} 선택하기
        </button>
      )}
    </div>
  );
}
