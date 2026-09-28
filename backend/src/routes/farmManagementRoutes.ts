import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';
import { FarmTask, FarmExpense } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const farmManagementRouter = Router();

// --- Farm Tasks ---
farmManagementRouter.get('/tasks', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const tasks = db.find('farm_tasks', t => t.userId === userId);
  tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return res.json(tasks);
});

farmManagementRouter.post('/tasks', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { farmId, cropId, title, description, dueDate, priority, category } = req.body;
  if (!title || !dueDate) {
    return res.status(400).json({ error: 'Task title and target due date are required' });
  }

  const newTask: FarmTask = {
    id: `task-${uuidv4().substring(0, 8)}`,
    farmId: farmId || 'farm-1',
    cropId,
    userId: req.user!.id,
    title,
    description: description || '',
    dueDate,
    priority: priority || 'MEDIUM',
    category: category || 'FERTILIZER',
    isCompleted: false
  };

  db.insert('farm_tasks', newTask);
  return res.status(201).json(newTask);
});

farmManagementRouter.put('/tasks/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.findById('farm_tasks', id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to modify this task' });
  }

  const { title, description, dueDate, priority, category, farmId, cropId } = req.body;
  const updated = db.update('farm_tasks', id, {
    title: title ?? task.title,
    description: description ?? task.description,
    dueDate: dueDate ?? task.dueDate,
    priority: priority ?? task.priority,
    category: category ?? task.category,
    farmId: farmId ?? task.farmId,
    cropId: cropId ?? task.cropId
  });

  return res.json(updated);
});

farmManagementRouter.patch('/tasks/:id/toggle', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.findById('farm_tasks', id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const updated = db.update('farm_tasks', id, {
    isCompleted: !task.isCompleted,
    completedAt: !task.isCompleted ? new Date().toISOString() : undefined
  });

  return res.json(updated);
});

farmManagementRouter.delete('/tasks/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.findById('farm_tasks', id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to delete this task' });
  }

  db.delete('farm_tasks', id);
  return res.json({ success: true, message: 'Task deleted successfully' });
});

// --- Farm Expenses & P&L ---
farmManagementRouter.get('/expenses', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const expenses = db.find('expenses', e => e.userId === userId);
  expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return res.json(expenses);
});

farmManagementRouter.post('/expenses', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { farmId, cropId, category, amount, date, notes } = req.body;
  if (!category) {
    return res.status(400).json({ error: 'Cost category is required' });
  }
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'A valid expense amount greater than ₹0 is required' });
  }

  const newExp: FarmExpense = {
    id: `exp-${uuidv4().substring(0, 8)}`,
    farmId: farmId || 'farm-1',
    cropId,
    userId: req.user!.id,
    category,
    amount: parsedAmount,
    date: date || new Date().toISOString().split('T')[0],
    notes: notes || ''
  };

  db.insert('expenses', newExp);
  return res.status(201).json(newExp);
});

farmManagementRouter.put('/expenses/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const exp = db.findById('expenses', id);
  if (!exp) return res.status(404).json({ error: 'Expense record not found' });
  if (exp.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to modify this expense record' });
  }

  const { category, amount, date, notes, farmId, cropId } = req.body;
  const updated = db.update('expenses', id, {
    category: category ?? exp.category,
    amount: amount ? parseFloat(amount) : exp.amount,
    date: date ?? exp.date,
    notes: notes ?? exp.notes,
    farmId: farmId ?? exp.farmId,
    cropId: cropId ?? exp.cropId
  });

  return res.json(updated);
});

farmManagementRouter.delete('/expenses/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const exp = db.findById('expenses', id);
  if (!exp) return res.status(404).json({ error: 'Expense record not found' });
  if (exp.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to delete this expense record' });
  }

  db.delete('expenses', id);
  return res.json({ success: true, message: 'Expense record deleted successfully' });
});

farmManagementRouter.get('/expenses/summary', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const expenses = db.find('expenses', e => e.userId === userId);
  const produceListings = db.find('produce_listings', p => p.farmerId === userId);

  let totalExpenses = 0;
  const byCategory: Record<string, number> = {};

  expenses.forEach(e => {
    totalExpenses += e.amount;
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  // Calculate projected crop revenues
  let projectedRevenue = 0;
  produceListings.forEach(p => {
    projectedRevenue += p.quantity * p.expectedPricePerUnit;
  });

  const estimatedProfit = projectedRevenue - totalExpenses;

  return res.json({
    totalExpenses,
    projectedRevenue,
    estimatedProfit,
    byCategory,
    expenseCount: expenses.length,
    activeListingCount: produceListings.length
  });
});
