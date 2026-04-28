import React, { useState } from 'react';
import { Search, Copy, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIDEStore } from '@/store/useIDEStore';
import type { ShadcnComponent } from '@/types';

const SHADCN_COMPONENTS: ShadcnComponent[] = [
  {
    name: 'Button',
    description: 'Displays a button or a component that looks like a button.',
    category: 'Inputs',
    preview: '<Button>Click me</Button>',
    code: `import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>`,
  },
  {
    name: 'Card',
    description: 'Displays a card with header, content, and footer.',
    category: 'Layout',
    preview: '<div className="border rounded-lg p-4"><h3>Card Title</h3><p>Content</p></div>',
    code: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`,
  },
  {
    name: 'Input',
    description: 'Displays a form input field.',
    category: 'Inputs',
    preview: '<input className="border rounded px-3 py-2" placeholder="Type..." />',
    code: `import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>`,
  },
  {
    name: 'Dialog',
    description: 'A window overlaid on the primary content.',
    category: 'Overlay',
    preview: '<div className="border rounded-lg p-4 shadow-lg">Dialog Content</div>',
    code: `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content goes here.</p>
  </DialogContent>
</Dialog>`,
  },
  {
    name: 'Tabs',
    description: 'A set of layered sections of content.',
    category: 'Navigation',
    preview: '<div className="border-b pb-1">Tab1 | Tab2 | Tab3</div>',
    code: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>`,
  },
  {
    name: 'Badge',
    description: 'Displays a badge or a component that looks like a badge.',
    category: 'Data Display',
    preview: '<span className="border rounded-full px-2 py-0.5 text-xs">Badge</span>',
    code: `import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>`,
  },
  {
    name: 'Toast',
    description: 'A succinct message that is displayed temporarily.',
    category: 'Feedback',
    preview: '<div className="border rounded-lg p-3 shadow">Toast notification</div>',
    code: `import { useToast } from "@/hooks/use-toast"

const { toast } = useToast()

toast({
  title: "Success!",
  description: "Your action was completed.",
})`,
  },
  {
    name: 'Select',
    description: 'Displays a list of options for the user to pick from.',
    category: 'Inputs',
    preview: '<select className="border rounded px-3 py-2"><option>Option 1</option></select>',
    code: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>`,
  },
  {
    name: 'Avatar',
    description: 'An image element with a fallback for representing the user.',
    category: 'Data Display',
    preview: '<div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">JD</div>',
    code: `import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`,
  },
  {
    name: 'Accordion',
    description: 'A vertically stacked set of interactive headings.',
    category: 'Data Display',
    preview: '<div className="border rounded"><div className="p-3 border-b">Section 1 ▼</div><div className="p-3">Content</div></div>',
    code: `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content for section 1.</AccordionContent>
  </AccordionItem>
</Accordion>`,
  },
];

const CATEGORIES = [...new Set(SHADCN_COMPONENTS.map((c) => c.category))];

export function ShadcnBrowser() {
  const { setShowShadcnBrowser, addMessage, setAiThinking } = useIDEStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewComponent, setPreviewComponent] = useState<ShadcnComponent | null>(null);

  const filtered = SHADCN_COMPONENTS.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (comp: ShadcnComponent) => {
    navigator.clipboard?.writeText(comp.code);
    setCopiedId(comp.name);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (comp: ShadcnComponent) => {
    addMessage({
      role: 'user',
      content: `Add a ${comp.name} component to my app`,
    });
    setAiThinking(true);
    setShowShadcnBrowser(false);
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `I've added the **${comp.name}** component to your app!\n\n\`\`\`tsx\n${comp.code}\n\`\`\`\n\nCheck the preview to see it in action.`,
      });
      setAiThinking(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">🎨 shadcn/ui Components</h2>
            <p className="text-xs text-muted-foreground">Browse, preview, and insert components</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setShowShadcnBrowser(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search & filters */}
        <div className="p-3 border-b border-border flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <Badge
              variant={!selectedCategory ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Component grid */}
        <ScrollArea className="flex-1">
          <div className="p-3 grid grid-cols-2 gap-3">
            {filtered.map((comp) => (
              <div
                key={comp.name}
                className="border border-border rounded-lg p-3 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium">{comp.name}</h3>
                    <p className="text-xs text-muted-foreground">{comp.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {comp.category}
                  </Badge>
                </div>

                {/* Mini preview */}
                <div className="bg-muted/50 rounded p-2 mb-2 text-xs font-mono text-muted-foreground h-12 overflow-hidden flex items-center justify-center">
                  {comp.name} Preview
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1 gap-1"
                    onClick={() => setPreviewComponent(comp)}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleCopy(comp)}
                  >
                    {copiedId === comp.name ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => handleInsert(comp)}
                  >
                    Insert
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Preview modal */}
        {previewComponent && (
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">{previewComponent.name} — Code</h3>
              <Button size="sm" variant="ghost" onClick={() => setPreviewComponent(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-auto max-h-[200px]">
              {previewComponent.code}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
