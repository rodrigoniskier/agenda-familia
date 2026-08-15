import React, { useState } from 'react';
import { FamilyMember } from '../types';
import { MEMBER_COLOR_PRESETS } from '../constants';
import { X, UserPlus, Users, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';

interface FamilyMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: FamilyMember[];
  onSaveMembers: (members: FamilyMember[]) => void;
}

const EMOJI_OPTIONS = ['👩', '👨', '👧', '👦', '👵', '👴', '👶', '🧑', '👱‍♀️', '👱‍♂️', '🐶', '🐱', '✨'];

export const FamilyMembersModal: React.FC<FamilyMembersModalProps> = ({
  isOpen,
  onClose,
  members,
  onSaveMembers,
}) => {
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingMember(null);
    setName('');
    setRole('');
    setAvatar('👩');
    setSelectedColor('rose');
    setError(null);
  };

  const startEdit = (m: FamilyMember) => {
    setIsAddingNew(false);
    setEditingMember(m);
    setName(m.name);
    setRole(m.role);
    setAvatar(m.avatar);
    setSelectedColor(m.color);
    setError(null);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do membro.');
      return;
    }

    const colorConfig = MEMBER_COLOR_PRESETS.find(c => c.id === selectedColor) || MEMBER_COLOR_PRESETS[0];

    if (editingMember) {
      // Update existing
      const updated = members.map(m => {
        if (m.id === editingMember.id) {
          return {
            ...m,
            name: name.trim(),
            role: role.trim() || 'Familiar',
            avatar,
            color: selectedColor,
            badgeBg: colorConfig.lightBg,
            textColor: colorConfig.text,
            borderColor: colorConfig.border,
          };
        }
        return m;
      });
      onSaveMembers(updated);
      setEditingMember(null);
    } else {
      // Add new
      const newMember: FamilyMember = {
        id: `m_${Date.now()}`,
        name: name.trim(),
        role: role.trim() || 'Familiar',
        avatar,
        color: selectedColor,
        badgeBg: colorConfig.lightBg,
        textColor: colorConfig.text,
        borderColor: colorConfig.border,
      };
      onSaveMembers([...members, newMember]);
      setIsAddingNew(false);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    if (members.length <= 1) {
      setError('A família precisa ter ao menos um membro cadastrado.');
      return;
    }
    const updated = members.filter(m => m.id !== memberId);
    onSaveMembers(updated);
    if (editingMember?.id === memberId) {
      setEditingMember(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="family-members-modal"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-[#1f1f27] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#1f1f27] bg-slate-50/50 dark:bg-[#16161e]/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Membros da Família
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16161e] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-[#23232e] bg-slate-50/60 dark:bg-[#16161e] hover:bg-slate-100 dark:hover:bg-[#1a1a24] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl p-1.5 rounded-lg bg-white dark:bg-[#0d0d12] shadow-xs border border-slate-200 dark:border-[#23232e]">
                    {member.avatar}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {member.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {member.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white dark:hover:bg-[#0d0d12] transition-colors cursor-pointer"
                    title="Editar membro"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white dark:hover:bg-[#0d0d12] transition-colors cursor-pointer"
                    title="Remover membro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Form */}
          {(isAddingNew || editingMember) && (
            <form onSubmit={handleSaveMember} className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-[#16161e] space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {editingMember ? `Editar ${editingMember.name}` : 'Adicionar Novo Familiar'}
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    id="member-name-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Ana, Carlos, Lucas..."
                    autoFocus
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Papel / Parentesco
                  </label>
                  <input
                    type="text"
                    id="member-role-input"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="Ex: Mãe, Pai, Filho(a)..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-[#23232e] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ícone / Avatar
                </label>
                <div className="flex flex-wrap gap-1">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setAvatar(em)}
                      className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                        avatar === em
                          ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-[0_0_8px_rgba(79,70,229,0.5)]'
                          : 'bg-white dark:bg-[#0d0d12] border-slate-200 dark:border-[#23232e] hover:bg-slate-100 dark:hover:bg-[#1f1f27]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Preset Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cor da Tag
                </label>
                <div className="flex items-center gap-1.5">
                  {MEMBER_COLOR_PRESETS.map(col => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedColor(col.id)}
                      className={`w-6 h-6 rounded-full ${col.bg} transition-all ring-offset-1 ring-offset-white dark:ring-offset-[#0d0d12] cursor-pointer ${
                        selectedColor === col.id ? 'ring-2 ring-indigo-500 scale-110 shadow-xs' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={col.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingMember(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0d0d12] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-member"
                  className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)] cursor-pointer"
                >
                  Salvar Membro
                </button>
              </div>
            </form>
          )}

          {!isAddingNew && !editingMember && (
            <button
              type="button"
              id="btn-add-member"
              onClick={startAddNew}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-[#23232e] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-[#16161e] text-xs font-bold transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Adicionar Novo Familiar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
