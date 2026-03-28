import { useMemo, useState, type ReactNode } from "react";

type Column<T> = {
    key: keyof T;
    header: string;
    width?: number;
    render?: (row: T) => ReactNode;
};

export function VirtualizedDataGrid<T extends Record<string, any>>({
    rows,
    columns,
    rowHeight = 40,
    height = 480,
}: {
    rows: T[];
    columns: Column<T>[];
    rowHeight?: number;
    height?: number;
}) {
    const [scrollTop, setScrollTop] = useState(0);

    const totalHeight = rows.length * rowHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
    const visibleCount = Math.ceil(height / rowHeight) + 10;
    const endIndex = Math.min(rows.length, startIndex + visibleCount);

    const visibleRows = useMemo(
        () => rows.slice(startIndex, endIndex),
        [rows, startIndex, endIndex],
    );

    return (
        <div className="rounded border border-gray-200 bg-white">
            <div className="grid border-b bg-gray-50 text-xs font-semibold uppercase text-gray-600" style={{ gridTemplateColumns: columns.map((c) => `${c.width ?? 1}fr`).join(" ") }}>
                {columns.map((column) => (
                    <div key={String(column.key)} className="px-3 py-2">
                        {column.header}
                    </div>
                ))}
            </div>

            <div
                className="overflow-auto"
                style={{ height }}
                onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
            >
                <div style={{ height: totalHeight, position: "relative" }}>
                    {visibleRows.map((row, idx) => {
                        const rowIndex = startIndex + idx;
                        return (
                            <div
                                key={rowIndex}
                                className="grid border-b border-gray-100 text-sm"
                                style={{
                                    position: "absolute",
                                    top: rowIndex * rowHeight,
                                    left: 0,
                                    right: 0,
                                    height: rowHeight,
                                    gridTemplateColumns: columns
                                        .map((c) => `${c.width ?? 1}fr`)
                                        .join(" "),
                                }}
                            >
                                {columns.map((column) => (
                                    <div key={`${rowIndex}-${String(column.key)}`} className="truncate px-3 py-2">
                                        {column.render ? column.render(row) : String(row[column.key] ?? "")}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
