import { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { createAssignment, loadAssignments, setActiveAssignment } from '../lib/assignments.js';
import { getChildValue } from '../lib/childWorkspace.js';

const SUBJECTS = [
    { value: 'chineseDictation', label: '中文听写', placeholder: '一行一个词语，例如：无论' },
    { value: 'englishDictation', label: '英文听写', placeholder: '一行一个英文词或短句，例如：apple:苹果' }
];

export default function AssignmentsView({ profileId, onChanged, onBack }) {
    const [assignments, setAssignments] = useState(() => loadAssignments(profileId));
    const [subject, setSubject] = useState('chineseDictation');
    const [title, setTitle] = useState('');
    const [itemText, setItemText] = useState('');
    const subjectInfo = SUBJECTS.find(item => item.value === subject);
    const activeId = useMemo(() => getChildValue(profileId, 'activeAssignmentId', ''), [assignments, profileId]);

    const refresh = () => {
        setAssignments(loadAssignments(profileId));
        onChanged();
    };
    const create = () => {
        const items = itemText.split(/\n+/).map(item => item.trim()).filter(Boolean);
        if (!title.trim() || !items.length) {
            alert('请填写作业名称和至少一道内容。');
            return;
        }
        createAssignment(profileId, { title, subject, items });
        setTitle('');
        setItemText('');
        refresh();
    };
    const select = id => {
        setActiveAssignment(profileId, id);
        refresh();
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-5">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="text-slate-400 font-bold flex items-center gap-1"><Icon name="arrowLeft" size={18}/> 返回</button>
                    <h1 className="font-bold text-slate-700">我的作业</h1>
                    <div className="w-10" />
                </div>
                <section className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
                    <h2 className="font-bold text-slate-700">新建作业</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {SUBJECTS.map(item => <button key={item.value} onClick={() => setSubject(item.value)} className={`py-2 rounded-xl text-sm font-bold ${subject === item.value ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{item.label}</button>)}
                    </div>
                    <input value={title} onChange={event => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="例如：7月13日语文听写" />
                    <textarea value={itemText} onChange={event => setItemText(event.target.value)} className="w-full min-h-28 rounded-xl border border-slate-200 px-3 py-2" placeholder={subjectInfo.placeholder} />
                    <button onClick={create} className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold">保存并设为当前作业</button>
                </section>
                <section className="space-y-3">
                    <h2 className="font-bold text-slate-600">已有作业</h2>
                    {!assignments.length && <div className="text-center text-slate-400 bg-white rounded-2xl p-6">还没有作业，先从上面新建一份。</div>}
                    {assignments.map(assignment => <button key={assignment.id} onClick={() => select(assignment.id)} className={`w-full text-left rounded-2xl border p-4 ${assignment.id === activeId ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-100'}`}>
                        <div className="flex justify-between gap-3"><strong className="text-slate-700">{assignment.title}</strong><span className="text-xs text-slate-400">{assignment.items.length} 项</span></div>
                        <div className="mt-1 text-sm text-slate-400">{SUBJECTS.find(item => item.value === assignment.subject)?.label || '其他作业'} · 已记录 {assignment.attempts?.length || 0} 次作答</div>
                    </button>)}
                </section>
            </div>
        </div>
    );
}
