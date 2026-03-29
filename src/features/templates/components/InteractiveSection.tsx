import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GripVertical, Check, X, Plus, Command, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Section, ShowcaseGrid, ShowcaseRow } from './Primitives';

interface TodoItem { id: string; text: string; done: boolean }

function ReorderList() {
  const [items, setItems] = useState([
    { id: '1', label: 'Design review meeting', priority: 'high' },
    { id: '2', label: 'Update API documentation', priority: 'medium' },
    { id: '3', label: 'Fix login page bug', priority: 'high' },
    { id: '4', label: 'Deploy staging build', priority: 'low' },
  ]);

  const priorityStyle: Record<string, string> = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    low: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-1.5">
      {items.map(item => (
        <Reorder.Item key={item.id} value={item}
          className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-primary/20 transition-colors">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          <span className="text-body-sm text-foreground flex-1">{item.label}</span>
          <Badge variant="outline" className={cn('text-label', priorityStyle[item.priority])}>{item.priority}</Badge>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

function InlineTodo() {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: 'Review pull request', done: false },
    { id: '2', text: 'Update design tokens', done: true },
    { id: '3', text: 'Write test cases', done: false },
  ]);
  const [newText, setNewText] = useState('');

  const toggle = (id: string) => setTodos(t => t.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const remove = (id: string) => setTodos(t => t.filter(i => i.id !== id));
  const add = () => {
    if (!newText.trim()) return;
    setTodos(t => [...t, { id: Date.now().toString(), text: newText.trim(), done: false }]);
    setNewText('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder="Add a task..." value={newText} onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()} className="h-8 text-body-sm" />
        <Button size="sm" onClick={add} className="h-8 shrink-0"><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      <AnimatePresence mode="popLayout">
        {todos.map(todo => (
          <motion.div key={todo.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 group">
            <button onClick={() => toggle(todo.id)}
              className={cn('h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                todo.done ? 'bg-primary border-primary' : 'border-muted-foreground/30 hover:border-primary')}>
              {todo.done && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </button>
            <span className={cn('text-body-sm flex-1 transition-all', todo.done && 'line-through text-muted-foreground')}>{todo.text}</span>
            <button onClick={() => remove(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function CommandPalettePreview() {
  const [open, setOpen] = useState(false);
  const items = [
    { label: 'Go to Dashboard', shortcut: '⌘D' },
    { label: 'Create Event', shortcut: '⌘E' },
    { label: 'Search Users', shortcut: '⌘U' },
    { label: 'Open Settings', shortcut: '⌘,' },
  ];

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-2 text-muted-foreground">
        <Command className="h-3.5 w-3.5" /> Command Palette
        <kbd className="ml-2 text-label-xs bg-muted px-1.5 py-0.5 rounded border border-border font-mono">⌘K</kbd>
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 left-0 w-80 rounded-xl border border-border bg-popover shadow-elevated z-20 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input className="flex-1 bg-transparent text-body-sm text-foreground placeholder:text-muted-foreground outline-none" placeholder="Type a command..." autoFocus />
            </div>
            <div className="p-1.5">
              {items.map(item => (
                <button key={item.label}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-body-sm text-foreground hover:bg-muted/50 transition-colors">
                  {item.label}
                  <kbd className="text-label-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono">{item.shortcut}</kbd>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function InteractiveSection() {
  return (
    <Section id="interactive" title="Interactive Patterns" description="Drag-and-drop, inline editing, command palette, and gesture-based UI.">
      <ShowcaseGrid label="Reorderable List (drag items)" cols={2}>
        <ReorderList />
        <div className="text-center py-8">
          <p className="text-body-sm text-muted-foreground mb-2">Uses Framer Motion's <code className="text-caption font-mono bg-muted px-1.5 py-0.5 rounded">Reorder</code> API</p>
          <p className="text-label text-muted-foreground">Drag items to reorder. No extra dependencies needed.</p>
        </div>
      </ShowcaseGrid>

      <ShowcaseGrid label="Inline Todo List (add, check, delete)" cols={2}>
        <InlineTodo />
        <div className="text-center py-8">
          <p className="text-body-sm text-muted-foreground mb-2">Animated list with <code className="text-caption font-mono bg-muted px-1.5 py-0.5 rounded">AnimatePresence</code></p>
          <p className="text-label text-muted-foreground">Items animate in/out smoothly on add/remove.</p>
        </div>
      </ShowcaseGrid>

      <ShowcaseRow label="Command Palette (click to open)">
        <CommandPalettePreview />
      </ShowcaseRow>
    </Section>
  );
}
