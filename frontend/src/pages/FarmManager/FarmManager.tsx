import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  PieChart,
  Layers,
  Sparkles,
  Droplets,
  Sprout,
  X,
  Edit2,
  AlertCircle,
  Check,
  Clock,
  Loader2
} from 'lucide-react';
import { subscribeToTable } from '../../services/supabaseClient';

interface FarmManagerProps {
  setActiveTab: (tab: string) => void;
}

export const FarmManager: React.FC<FarmManagerProps> = ({ setActiveTab }) => {
  const { t } = useLanguage();

  const [tasks, setTasks] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalExpenses: 18200,
    projectedRevenue: 246000,
    estimatedProfit: 227800,
    byCategory: {
      MACHINERY: 4500,
      SEEDS: 5700,
      FERTILIZER: 3200,
      LABOUR: 4800
    }
  });

  // Modal open states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Form submission & loading states
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Error & Toast state
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Task form fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskCategory, setTaskCategory] = useState('FERTILIZER');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskFarmId, setTaskFarmId] = useState('farm-1');
  const [taskCropId, setTaskCropId] = useState('');

  // Expense form fields
  const [expCategory, setExpCategory] = useState('FERTILIZER');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');
  const [expFarmId, setExpFarmId] = useState('farm-1');
  const [expCropId, setExpCropId] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadData = async () => {
    try {
      const [tRes, eRes, sRes, fRes] = await Promise.all([
        fetch('/api/farm/tasks', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch('/api/farm/expenses', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch('/api/farm/expenses/summary', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch('/api/farms', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } })
      ]);
      if (tRes.ok) setTasks(await tRes.json());
      if (eRes.ok) setExpenses(await eRes.json());
      if (sRes.ok) setSummary(await sRes.json());
      if (fRes.ok) {
        const farmsData = await fRes.json();
        setFarms(farmsData);
        if (farmsData.length > 0 && !taskFarmId) {
          setTaskFarmId(farmsData[0].id);
          setExpFarmId(farmsData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load farm management data:', err);
    }
  };

  useEffect(() => {
    loadData();

    let farmChan: any = null;
    let soilChan: any = null;
    try {
      farmChan = subscribeToTable('farms', { onChange: loadData });
      soilChan = subscribeToTable('soil_health_records', { onChange: loadData });
    } catch {}

    return () => {
      if (farmChan) farmChan.unsubscribe();
      if (soilChan) soilChan.unsubscribe();
    };
  }, []);

  // Universal Escape key listener for FarmManager modals
  useEffect(() => {
    if (!showTaskModal && !showExpenseModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTaskModal(false);
        setEditingTask(null);
        setShowExpenseModal(false);
        setEditingExpense(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTaskModal, showExpenseModal]);

  // Reset or initialize task modal form
  const openNewTaskModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
    setTaskCategory('FERTILIZER');
    setTaskPriority('MEDIUM');
    setTaskDesc('');
    setTaskFarmId(farms[0]?.id || 'farm-1');
    setTaskCropId(farms[0]?.crops?.[0]?.id || '');
    setTaskError(null);
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task: any) => {
    setEditingTask(task);
    setTaskTitle(task.title || '');
    setTaskDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setTaskCategory(task.category || 'FERTILIZER');
    setTaskPriority(task.priority || 'MEDIUM');
    setTaskDesc(task.description || '');
    setTaskFarmId(task.farmId || farms[0]?.id || 'farm-1');
    setTaskCropId(task.cropId || '');
    setTaskError(null);
    setShowTaskModal(true);
  };

  // Reset or initialize expense modal form
  const openNewExpenseModal = () => {
    setEditingExpense(null);
    setExpCategory('FERTILIZER');
    setExpAmount('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpNotes('');
    setExpFarmId(farms[0]?.id || 'farm-1');
    setExpCropId(farms[0]?.crops?.[0]?.id || '');
    setExpenseError(null);
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (exp: any) => {
    setEditingExpense(exp);
    setExpCategory(exp.category || 'FERTILIZER');
    setExpAmount(exp.amount ? exp.amount.toString() : '');
    setExpDate(exp.date || new Date().toISOString().split('T')[0]);
    setExpNotes(exp.notes || '');
    setExpFarmId(exp.farmId || farms[0]?.id || 'farm-1');
    setExpCropId(exp.cropId || '');
    setExpenseError(null);
    setShowExpenseModal(true);
  };

  // Toggle task complete
  const handleToggleTask = async (id: string) => {
    try {
      const res = await fetch(`/api/farm/tasks/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
        showToast(updated.isCompleted ? 'Task marked as completed! ✓' : 'Task marked as active');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete task
  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this scheduled task?')) return;
    setDeletingTaskId(id);
    try {
      const res = await fetch(`/api/farm/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== id));
        showToast('Task deleted successfully');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to delete task', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting task', 'error');
    } finally {
      setDeletingTaskId(null);
    }
  };

  // Submit Task (Create or Edit)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);

    if (!taskTitle.trim()) {
      setTaskError('Task title is required.');
      return;
    }
    if (!taskDueDate) {
      setTaskError('Please select a target due date.');
      return;
    }

    setIsSubmittingTask(true);
    try {
      const isEditing = !!editingTask;
      const url = isEditing ? `/api/farm/tasks/${editingTask.id}` : '/api/farm/tasks';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          title: taskTitle.trim(),
          dueDate: taskDueDate,
          category: taskCategory,
          priority: taskPriority,
          description: taskDesc.trim(),
          farmId: taskFarmId,
          cropId: taskCropId || undefined
        })
      });

      if (res.ok) {
        setShowTaskModal(false);
        setEditingTask(null);
        setTaskTitle('');
        setTaskDesc('');
        showToast(isEditing ? 'Task updated successfully!' : 'New task scheduled successfully!');
        await loadData();
      } else {
        const err = await res.json();
        setTaskError(err.error || 'Failed to save task.');
      }
    } catch (err: any) {
      setTaskError(err.message || 'Network error while saving task.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    setDeletingExpenseId(id);
    try {
      const res = await fetch(`/api/farm/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
      });
      if (res.ok) {
        showToast('Expense record deleted successfully');
        await loadData();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to delete expense', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting expense', 'error');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  // Submit Expense (Create or Edit)
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError(null);

    const parsed = parseFloat(expAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setExpenseError('Please enter a valid expense amount greater than ₹0.');
      return;
    }
    if (!expCategory) {
      setExpenseError('Please select an expense cost category.');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const isEditing = !!editingExpense;
      const url = isEditing ? `/api/farm/expenses/${editingExpense.id}` : '/api/farm/expenses';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          category: expCategory,
          amount: parsed,
          date: expDate || new Date().toISOString().split('T')[0],
          notes: expNotes.trim(),
          farmId: expFarmId,
          cropId: expCropId || undefined
        })
      });

      if (res.ok) {
        setShowExpenseModal(false);
        setEditingExpense(null);
        setExpAmount('');
        setExpNotes('');
        showToast(
          isEditing
            ? `Expense updated successfully to ₹${parsed.toLocaleString('en-IN')}!`
            : `Expense of ₹${parsed.toLocaleString('en-IN')} recorded successfully!`
        );
        await loadData();
      } else {
        const err = await res.json();
        setExpenseError(err.error || 'Failed to record expense. Please check all fields.');
      }
    } catch (err: any) {
      setExpenseError(err.message || 'Network error while recording expense.');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Available crops based on selected farm
  const currentFarm = farms.find(f => f.id === expFarmId) || farms[0];
  const availableCrops = currentFarm?.crops || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Toast Alert Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-800 text-white border border-emerald-600'
              : 'bg-red-800 text-white border border-red-600'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <span>📊 {currentFarm?.name || 'Sri Venkateswara Farm'} ({currentFarm?.totalArea || 5.5} Acres)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Farm Management & P&L Tracker
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Coordinate crop calendar tasks, record farm input costs, and track harvest profitability
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openNewTaskModal}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
          <button
            onClick={openNewExpenseModal}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
          >
            <DollarSign className="w-4 h-4" /> Record Cost
          </button>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Cost */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-red-100">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
            {t('totalExpenses')}
          </span>
          <p className="text-2xl font-black text-red-600 mt-1">
            ₹{summary.totalExpenses?.toLocaleString('en-IN') || '18,200'}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">
            {expenses.length} logged expense entries
          </span>
        </div>

        {/* Projected Revenue */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-blue-100">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
            {t('projectedRevenue')}
          </span>
          <p className="text-2xl font-black text-blue-700 mt-1">
            ₹{summary.projectedRevenue?.toLocaleString('en-IN') || '2,46,000'}
          </p>
          <span className="text-[10px] text-gray-400 mt-1 block">
            From active harvest lots & mandis
          </span>
        </div>

        {/* Estimated Profit */}
        <div className="bg-emerald-50 rounded-3xl p-5 shadow-sm border border-emerald-200">
          <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider block">
            {t('netProfit')}
          </span>
          <p
            className={`text-2xl font-black mt-1 ${
              summary.estimatedProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {summary.estimatedProfit >= 0 ? '+' : ''}₹{summary.estimatedProfit?.toLocaleString('en-IN') || '2,27,800'}
          </p>
          <span className="text-[10px] text-emerald-800 font-semibold mt-1 block">
            Estimated Net Return: {summary.totalExpenses > 0 ? (summary.projectedRevenue / summary.totalExpenses).toFixed(1) : '12'}x
          </span>
        </div>
      </div>

      {/* Main Grid: Tasks Calendar & Expenses List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farm Task Calendar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <span>📅</span> Scheduled Farm Operations ({tasks.length})
            </h3>
            <button
              onClick={openNewTaskModal}
              className="text-xs text-emerald-700 font-bold hover:underline"
            >
              + New Task
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No scheduled tasks yet. Click "+ New Task" to add one.</p>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    task.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-emerald-100 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-emerald-600 hover:text-emerald-700 shrink-0"
                      title={task.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${task.isCompleted ? 'fill-emerald-600 text-white' : 'text-gray-300'}`}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                          Due: {task.dueDate}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded">
                          {task.category?.toLowerCase()?.replace('_', ' ')}
                        </span>
                        {task.priority === 'HIGH' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditTaskModal(task)}
                      className="p-1.5 text-gray-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={deletingTaskId === task.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Delete task"
                    >
                      {deletingTaskId === task.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <span>🧾</span> Farm Input Costs ({expenses.length})
            </h3>
            <button
              onClick={openNewExpenseModal}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              + Record Cost
            </button>
          </div>

          <div className="space-y-2.5">
            {expenses.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No expenses recorded yet. Click "+ Record Cost" to log one.</p>
            ) : (
              expenses.map(exp => (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs hover:border-amber-200 transition"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 capitalize">
                        {exp.category?.toLowerCase()?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {exp.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {exp.notes || 'Input purchase / service'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black text-gray-900">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => openEditExpenseModal(exp)}
                      className="p-1.5 text-gray-400 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition"
                      title="Edit expense"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      disabled={deletingExpenseId === exp.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Delete expense"
                    >
                      {deletingExpenseId === exp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add / Edit Task */}
      {showTaskModal && (
        <div
          onClick={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4"
          >
            <button
              onClick={() => {
                setShowTaskModal(false);
                setEditingTask(null);
              }}
              aria-label="Close dialog"
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition active:scale-95 border border-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-gray-900">
              {editingTask ? 'Edit Farm Operation' : 'Schedule Farm Operation'}
            </h3>

            {taskError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{taskError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. 2nd split Urea application..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Category</label>
                  <select
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="FERTILIZER">Fertilizer Application</option>
                    <option value="IRRIGATION">Irrigation Cycle</option>
                    <option value="PEST_INSPECTION">Pest & Disease Inspection</option>
                    <option value="WEEDING">Weeding & Hoeing</option>
                    <option value="HARVEST">Harvesting Lot</option>
                    <option value="SOWING">Sowing & Seed Treatment</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Target Due Date *</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="HIGH">High (Urgent)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Associated Crop</label>
                  <select
                    value={taskCropId}
                    onChange={e => setTaskCropId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">General Farm Activity</option>
                    {availableCrops.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.cropName} ({c.variety})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Operation Details & Notes</label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="e.g. Ensure soil moisture is optimal before broadcasting..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-extrabold text-xs transition"
                >
                  Cancel / ಮುಚ್ಚಿ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmittingTask ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Scheduled Task...</span>
                    </>
                  ) : (
                    <span>{editingTask ? 'Update Scheduled Task' : 'Save Scheduled Task'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record / Edit Expense */}
      {showExpenseModal && (
        <div
          onClick={() => {
            setShowExpenseModal(false);
            setEditingExpense(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4"
          >
            <button
              onClick={() => {
                setShowExpenseModal(false);
                setEditingExpense(null);
              }}
              aria-label="Close dialog"
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition active:scale-95 border border-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-gray-900">
              {editingExpense ? 'Edit Farm Expense' : 'Record Farm Expense'}
            </h3>

            {expenseError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{expenseError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Cost Category *</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="FERTILIZER">Fertilizers & Nutrients</option>
                    <option value="SEEDS">Certified Seeds</option>
                    <option value="PESTICIDE">Crop Protection</option>
                    <option value="LABOUR">Farm Labour</option>
                    <option value="MACHINERY">Tractor / Machinery Hire</option>
                    <option value="IRRIGATION">Borewell & Irrigation</option>
                    <option value="TRANSPORT">Transport & Logistics</option>
                    <option value="OTHER">Other Farm Expenses</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Amount Incurred (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    placeholder="e.g. 2400"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Date Incurred</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Associated Crop / Farm</label>
                  <select
                    value={expCropId}
                    onChange={e => setExpCropId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">General Farm Cost</option>
                    {availableCrops.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.cropName} ({c.variety})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Receipt / Item Notes</label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
                  placeholder="e.g. Purchased 2 bags DAP from Sri Lakshmi Agri Inputs"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                  }}
                  className="px-4 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-extrabold text-xs transition"
                >
                  Cancel / ಮುಚ್ಚಿ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmittingExpense ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Expense Entry...</span>
                    </>
                  ) : (
                    <span>{editingExpense ? 'Update Expense Entry' : 'Log Expense Entry'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
