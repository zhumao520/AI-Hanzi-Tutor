function titleOf(diagram) {
    return diagram?.title ? <div className="font-bold text-slate-700 mb-2">{diagram.title}</div> : null;
}

function Formula({ diagram }) {
    if (!diagram?.formula && !diagram?.question) return null;
    return (
        <div className="mt-2 text-xs text-slate-500 space-y-1">
            {diagram.formula && <div>{diagram.formula}</div>}
            {diagram.question && <div>{diagram.question}</div>}
        </div>
    );
}

function Grouping({ diagram }) {
    const groups = Array.isArray(diagram.groups) ? diagram.groups : [];
    return (
        <div>
            {titleOf(diagram)}
            <div className="space-y-2">
                {groups.map((group, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-xs text-slate-500">{diagram.labels?.[index] || `第${index + 1}份`}</span>
                        <div className="flex flex-wrap gap-1">
                            {(Array.isArray(group) ? group : []).slice(0, 24).map((item, itemIndex) => (
                                <span key={itemIndex} className="w-7 h-7 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-sm shadow-sm">{item || '●'}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <Formula diagram={diagram} />
        </div>
    );
}

function Bar({ diagram }) {
    const parts = Array.isArray(diagram.parts) ? diagram.parts : [];
    const max = Math.max(...parts.map(part => Number(part.value) || 0), 1);
    return (
        <div>
            {titleOf(diagram)}
            <div className="space-y-2">
                {parts.map((part, index) => {
                    const value = Number(part.value) || 0;
                    return (
                        <div key={index} className="grid grid-cols-[64px_1fr_36px] items-center gap-2 text-xs">
                            <span className="text-slate-500">{part.label || `部分${index + 1}`}</span>
                            <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.max(8, value / max * 100)}%` }} />
                            </div>
                            <b className="text-slate-600">{value}</b>
                        </div>
                    );
                })}
            </div>
            <Formula diagram={diagram} />
        </div>
    );
}

function Compare({ diagram }) {
    const left = diagram.left || {};
    const right = diagram.right || {};
    return <Bar diagram={{ ...diagram, parts: [left, right] }} />;
}

function NumberLine({ diagram }) {
    const marks = Array.isArray(diagram.marks) && diagram.marks.length ? diagram.marks : [diagram.start || 0, diagram.end || 10];
    return (
        <div>
            {titleOf(diagram)}
            <svg viewBox="0 0 320 90" className="w-full h-24">
                <line x1="24" y1="52" x2="296" y2="52" stroke="#64748b" strokeWidth="2" />
                {marks.map((mark, index) => {
                    const x = 24 + (index / Math.max(marks.length - 1, 1)) * 272;
                    return <g key={index}><line x1={x} y1="44" x2={x} y2="60" stroke="#64748b" /><text x={x} y="78" textAnchor="middle" fontSize="12" fill="#475569">{mark}</text></g>;
                })}
                {(diagram.jumps || []).map((jump, index) => {
                    const fromIndex = marks.indexOf(jump.from);
                    const toIndex = marks.indexOf(jump.to);
                    if (fromIndex < 0 || toIndex < 0) return null;
                    const x1 = 24 + (fromIndex / Math.max(marks.length - 1, 1)) * 272;
                    const x2 = 24 + (toIndex / Math.max(marks.length - 1, 1)) * 272;
                    const mid = (x1 + x2) / 2;
                    return <g key={index}><path d={`M ${x1} 48 Q ${mid} 12 ${x2} 48`} fill="none" stroke="#f97316" strokeWidth="2" /><text x={mid} y="18" textAnchor="middle" fontSize="12" fill="#ea580c">{jump.label}</text></g>;
                })}
            </svg>
            <Formula diagram={diagram} />
        </div>
    );
}

function Rectangle({ diagram }) {
    return (
        <div>
            {titleOf(diagram)}
            <svg viewBox="0 0 320 170" className="w-full h-44">
                <rect x="72" y="40" width="176" height="90" fill="#eff6ff" stroke="#2563eb" strokeWidth="3" rx="4" />
                <text x="160" y="28" textAnchor="middle" fontSize="13" fill="#475569">{diagram.widthLabel || '长'}</text>
                <text x="264" y="88" fontSize="13" fill="#475569">{diagram.heightLabel || '宽'}</text>
            </svg>
            <Formula diagram={diagram} />
        </div>
    );
}

function Triangle({ diagram }) {
    const labels = diagram.sideLabels || [];
    return (
        <div>
            {titleOf(diagram)}
            <svg viewBox="0 0 320 180" className="w-full h-44">
                <polygon points="160,28 62,140 258,140" fill="#f0fdf4" stroke="#16a34a" strokeWidth="3" />
                <text x="94" y="86" fontSize="13" fill="#475569">{labels[0] || ''}</text>
                <text x="222" y="86" fontSize="13" fill="#475569">{labels[1] || ''}</text>
                <text x="160" y="160" textAnchor="middle" fontSize="13" fill="#475569">{labels[2] || ''}</text>
            </svg>
            <Formula diagram={diagram} />
        </div>
    );
}

function CircleDiagram({ diagram }) {
    return (
        <div>
            {titleOf(diagram)}
            <svg viewBox="0 0 320 180" className="w-full h-44">
                <circle cx="160" cy="90" r="58" fill="#fefce8" stroke="#ca8a04" strokeWidth="3" />
                <line x1="160" y1="90" x2="218" y2="90" stroke="#f97316" strokeWidth="3" />
                <line x1="102" y1="90" x2="218" y2="90" stroke="#64748b" strokeDasharray="5 4" />
                <text x="190" y="82" fontSize="12" fill="#ea580c">{diagram.radiusLabel || '半径'}</text>
                <text x="160" y="164" textAnchor="middle" fontSize="12" fill="#475569">{diagram.diameterLabel || '直径'}</text>
            </svg>
            <Formula diagram={diagram} />
        </div>
    );
}

function Angle({ diagram }) {
    return (
        <div>
            {titleOf(diagram)}
            <svg viewBox="0 0 320 150" className="w-full h-36">
                <line x1="90" y1="115" x2="245" y2="115" stroke="#334155" strokeWidth="4" />
                <line x1="90" y1="115" x2="190" y2="38" stroke="#334155" strokeWidth="4" />
                <path d="M 125 115 A 35 35 0 0 1 118 88" fill="none" stroke="#f97316" strokeWidth="3" />
                <text x="132" y="92" fontSize="14" fill="#ea580c">{diagram.angleLabel || ''}</text>
            </svg>
            <Formula diagram={diagram} />
        </div>
    );
}

function Cuboid({ diagram }) {
    return (
        <div>
            {titleOf(diagram)}
            <svg viewBox="0 0 340 220" className="w-full h-52">
                <polygon points="92,70 232,70 282,35 142,35" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
                <polygon points="232,70 282,35 282,145 232,180" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2" />
                <rect x="92" y="70" width="140" height="110" fill="#eff6ff" stroke="#2563eb" strokeWidth="3" />
                <text x="162" y="204" textAnchor="middle" fontSize="13" fill="#475569">{diagram.lengthLabel || '长'}</text>
                <text x="270" y="88" fontSize="13" fill="#475569">{diagram.widthLabel || '宽'}</text>
                <text x="52" y="128" fontSize="13" fill="#475569">{diagram.heightLabel || '高'}</text>
            </svg>
            <Formula diagram={diagram} />
        </div>
    );
}

function Cylinder({ diagram }) {
    return (
        <div>
            {titleOf(diagram)}
            <svg viewBox="0 0 320 220" className="w-full h-52">
                <ellipse cx="160" cy="55" rx="76" ry="26" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
                <path d="M84 55 V155 C84 170 236 170 236 155 V55" fill="#fffbeb" stroke="#d97706" strokeWidth="3" />
                <ellipse cx="160" cy="155" rx="76" ry="26" fill="none" stroke="#d97706" strokeWidth="3" />
                <text x="245" y="110" fontSize="13" fill="#475569">{diagram.heightLabel || '高'}</text>
                <text x="160" y="38" textAnchor="middle" fontSize="13" fill="#475569">{diagram.radiusLabel || diagram.diameterLabel || '底面'}</text>
            </svg>
            <Formula diagram={diagram} />
        </div>
    );
}

function Cone({ diagram }) {
    return (
        <div>
            {titleOf(diagram)}
            <svg viewBox="0 0 320 220" className="w-full h-52">
                <path d="M160 28 L76 160 C76 185 244 185 244 160 Z" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="3" />
                <ellipse cx="160" cy="160" rx="84" ry="28" fill="none" stroke="#7c3aed" strokeWidth="3" />
                <line x1="160" y1="28" x2="160" y2="160" stroke="#a78bfa" strokeDasharray="5 4" />
                <text x="172" y="96" fontSize="13" fill="#475569">{diagram.heightLabel || '高'}</text>
                <text x="160" y="204" textAnchor="middle" fontSize="13" fill="#475569">{diagram.radiusLabel || '底面半径'}</text>
            </svg>
            <Formula diagram={diagram} />
        </div>
    );
}

function Sphere({ diagram }) {
    return (
        <div>
            {titleOf(diagram)}
            <svg viewBox="0 0 320 200" className="w-full h-48">
                <circle cx="160" cy="100" r="68" fill="#ecfeff" stroke="#0891b2" strokeWidth="3" />
                <ellipse cx="160" cy="100" rx="68" ry="20" fill="none" stroke="#67e8f9" strokeWidth="2" />
                <line x1="160" y1="100" x2="228" y2="100" stroke="#0891b2" strokeWidth="3" />
                <text x="190" y="92" fontSize="13" fill="#475569">{diagram.radiusLabel || '半径'}</text>
                <text x="160" y="184" textAnchor="middle" fontSize="13" fill="#475569">{diagram.diameterLabel || ''}</text>
            </svg>
            <Formula diagram={diagram} />
        </div>
    );
}

export default function MathDiagram({ diagram }) {
    if (!diagram || typeof diagram !== 'object' || !diagram.type) return null;
    const type = String(diagram.type);
    const content = {
        grouping: <Grouping diagram={diagram} />,
        bar: <Bar diagram={diagram} />,
        compare: <Compare diagram={diagram} />,
        numberLine: <NumberLine diagram={diagram} />,
        rectangle: <Rectangle diagram={diagram} />,
        triangle: <Triangle diagram={diagram} />,
        circle: <CircleDiagram diagram={diagram} />,
        angle: <Angle diagram={diagram} />,
        cuboid: <Cuboid diagram={diagram} />,
        cube: <Cuboid diagram={diagram} />,
        cylinder: <Cylinder diagram={diagram} />,
        cone: <Cone diagram={diagram} />,
        sphere: <Sphere diagram={diagram} />
    }[type];
    if (!content) return null;
    return <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">{content}</div>;
}
