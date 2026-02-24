const MODEL_COLORS: [RegExp, string][] = [
  [/claude/i, 'bg-model-claude'],
  [/nova/i, 'bg-model-nova'],
  [/titan/i, 'bg-model-titan'],
];

export function getModelColorClass(name: string): string {
  for (const [re, cls] of MODEL_COLORS) {
    if (re.test(name)) return cls;
  }
  return 'bg-model-default';
}
