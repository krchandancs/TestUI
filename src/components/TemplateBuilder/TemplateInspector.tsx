// src/components/TemplateBuilder/TemplateInspector.tsx
// ─────────────────────────────────────────────────────────────
// Right-panel inspector for the Template Builder.
// Covers all 18 node types with full property editors.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import type {
  TemplateNode,
  LabelConfig,
  SectionNode,
  TextFieldNode,
  ParagraphNode,
  RichTextBlockNode,
  DropdownNode,
  NumberNode,
  DateNode,
  ComputedNode,
  StaticLabelNode,
  RepeatGroupNode,
  ColumnLayoutNode,
  TemplateRefNode,
  PageBreakNode,
  IfBlockNode,
  SwitchBlockNode,
  ExpressionValueNode,
  HeaderNode,
  FooterNode,
  ImageEmbedNode,
  ConditionalExpression,
  ExpressionClause,
  ExpressionOperator,
  AiGenerationConfig,
} from '../../types/template';

interface Props {
  node: TemplateNode | null;
  onUpdate: (updated: TemplateNode) => void;
}

// ── Primitive field components ─────────────────────────────────

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={S.label}>{children}</div>
);

const TextInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}> = ({ value, onChange, placeholder, mono }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{ ...S.input, fontFamily: mono ? 'monospace' : undefined }}
  />
);

const Textarea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  height?: number;
  mono?: boolean;
}> = ({ value, onChange, placeholder, height = 72, mono }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{ ...S.input, height, resize: 'vertical', lineHeight: 1.5,
      fontFamily: mono ? 'monospace' : undefined }}
  />
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <label style={S.toggleRow}>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 32, height: 18, borderRadius: 9,
        background: checked ? '#0e9f6e' : '#1e293b',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.15s',
        border: `1px solid ${checked ? '#0e9f6e' : '#334155'}`,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: checked ? 14 : 2,
        width: 12, height: 12, borderRadius: '50%',
        background: '#f1f5f9', transition: 'left 0.15s',
      }} />
    </div>
    <span style={S.toggleLabel}>{label}</span>
  </label>
);

const Sel: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}> = ({ value, onChange, options, fullWidth }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{ ...S.select, width: fullWidth ? '100%' : undefined }}
  >
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Div: React.FC<{ label: string }> = ({ label }) => (
  <div style={S.divider}>{label}</div>
);

const Row: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 6 }) => (
  <div style={{ display: 'flex', gap, alignItems: 'center', marginTop: 6 }}>{children}</div>
);

// ── Conditional expression builder ─────────────────────────────

const OPERATORS: { value: ExpressionOperator; label: string }[] = [
  { value: '==',       label: 'equals' },
  { value: '!=',       label: '≠' },
  { value: '>',        label: '>' },
  { value: '<',        label: '<' },
  { value: '>=',       label: '≥' },
  { value: '<=',       label: '≤' },
  { value: 'notEmpty', label: 'not empty' },
  { value: 'isEmpty',  label: 'is empty' },
  { value: 'contains', label: 'contains' },
];

const ExpressionBuilder: React.FC<{
  expression: ConditionalExpression;
  onChange: (e: ConditionalExpression) => void;
  title: string;
}> = ({ expression, onChange, title }) => {
  const add = () => onChange({ ...expression, clauses: [...expression.clauses, { field: '', operator: '==', value: '' }] });
  const upd = (i: number, p: Partial<ExpressionClause>) =>
    onChange({ ...expression, clauses: expression.clauses.map((c, idx) => idx === i ? { ...c, ...p } : c) });
  const rm  = (i: number) => onChange({ ...expression, clauses: expression.clauses.filter((_, idx) => idx !== i) });

  return (
    <div style={S.exprBox}>
      <div style={S.exprHeader}>
        <span style={S.exprTitle}>{title}</span>
        <Sel value={expression.logic} onChange={v => onChange({ ...expression, logic: v as 'AND' | 'OR' })}
          options={[{ value: 'AND', label: 'ALL (AND)' }, { value: 'OR', label: 'ANY (OR)' }]} />
      </div>
      {expression.clauses.map((c, i) => (
        <div key={i} style={S.clauseRow}>
          <input value={c.field} onChange={e => upd(i, { field: e.target.value })}
            placeholder="context.field" style={{ ...S.input, fontFamily: 'monospace', flex: 1, minWidth: 80 }} />
          <Sel value={c.operator} onChange={v => upd(i, { operator: v as ExpressionOperator })} options={OPERATORS} />
          {!['notEmpty','isEmpty'].includes(c.operator) && (
            <input value={String(c.value ?? '')} onChange={e => upd(i, { value: e.target.value })}
              placeholder="value" style={{ ...S.input, flex: 1, minWidth: 60 }} />
          )}
          <button onClick={() => rm(i)} style={S.rmBtn}>✕</button>
        </div>
      ))}
      <button onClick={add} style={S.addBtn}>+ Add condition</button>
    </div>
  );
};

// ── AI config ──────────────────────────────────────────────────

const AiConfigEditor: React.FC<{
  config: AiGenerationConfig;
  onChange: (c: AiGenerationConfig) => void;
}> = ({ config, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <Toggle checked={config.enabled} onChange={v => onChange({ ...config, enabled: v })}
      label="Enable AI generation for this section" />
    {config.enabled && (<>
      <Label>System instruction</Label>
      <Textarea value={config.systemInstruction ?? ''} height={80}
        onChange={v => onChange({ ...config, systemInstruction: v })}
        placeholder="Describe what the AI should write for this section…" />
      <Row>
        <div style={{ flex: 1 }}>
          <Label>Max tokens</Label>
          <TextInput value={String(config.maxTokens ?? 1024)}
            onChange={v => onChange({ ...config, maxTokens: parseInt(v) || 1024 })} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Temperature</Label>
          <TextInput value={String(config.temperature ?? 0.3)}
            onChange={v => onChange({ ...config, temperature: parseFloat(v) || 0.3 })} />
        </div>
      </Row>
    </>)}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Per-type editors — all 18 types
// ─────────────────────────────────────────────────────────────

// ── Content ───────────────────────────────────────────────────

const TextFieldEditor: React.FC<{ node: TextFieldNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Text Field" />
  <Label>Binding key</Label>
  <TextInput value={node.bindingKey} onChange={v => u({ ...node, bindingKey: v })} placeholder="synoptic.tumorType" mono />
  <Label>Placeholder</Label>
  <TextInput value={node.placeholder ?? ''} onChange={v => u({ ...node, placeholder: v })} />
  <Label>Validation regex</Label>
  <TextInput value={node.validationRegex ?? ''} onChange={v => u({ ...node, validationRegex: v })} placeholder="Optional" mono />
  <Row>
    <div style={{ flex: 1 }}>
      <Label>Max length</Label>
      <TextInput value={String(node.maxLength ?? '')} onChange={v => u({ ...node, maxLength: parseInt(v) || undefined })} placeholder="∞" />
    </div>
  </Row>
</>);

const ParagraphEditor: React.FC<{ node: ParagraphNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Data Paragraph" />
  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, lineHeight: 1.5, padding: '8px', background: '#1e293b', borderRadius: 5, border: '1px solid #334155' }}>
    💡 A <strong style={{ color: '#e2e8f0' }}>Data Paragraph</strong> is a slot filled automatically from case data at report time. Set the binding key to the context field you want (e.g. <code style={{ color: '#7dd3fc' }}>diagnostic.grossDescription</code>).<br /><br />
    For text you <strong style={{ color: '#e2e8f0' }}>type yourself</strong> — disclaimers, standard phrases — use a <strong style={{ color: '#0891b2' }}>Rich Text Block</strong> instead.
  </div>
  <Label>Binding key (case data source)</Label>
  <TextInput value={node.bindingKey} onChange={v => u({ ...node, bindingKey: v })} placeholder="diagnostic.grossDescription" mono />
  <div style={{ marginTop: 4, marginBottom: 4 }}>
    <a href="#" onClick={e => { e.preventDefault(); }} style={{ fontSize: 10, color: '#7dd3fc' }}>
      Common binding keys ↓
    </a>
    <div style={{ fontSize: 9, color: '#64748b', marginTop: 4, lineHeight: 1.6, fontFamily: 'monospace' }}>
      diagnostic.grossDescription<br />
      diagnostic.microscopicDescription<br />
      diagnostic.ancillaryStudies<br />
      diagnostic.comment<br />
      order.clinicalIndication<br />
      specimen.grossDescription
    </div>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
    <Toggle checked={node.richText ?? true}    onChange={v => u({ ...node, richText: v })}   label="Rich text (bold, italic, lists)" />
    <Toggle checked={node.aiWritable ?? true}  onChange={v => u({ ...node, aiWritable: v })} label="AI can write to this field" />
  </div>
</>);

// ── Rich Text Block editor ─────────────────────────────────────
// For freeform prose authored directly in the template.

const RichTextBlockEditor: React.FC<{ node: RichTextBlockNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Rich Text Block" />
  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, lineHeight: 1.5, padding: '8px', background: '#1e293b', borderRadius: 5, border: '1px solid #334155' }}>
    💡 A <strong style={{ color: '#e2e8f0' }}>Rich Text Block</strong> contains prose you type directly — it is the same in every report. Use it for disclaimers, standard statements, or any fixed text.
  </div>
  <Label>Content</Label>
  <Textarea
    value={node.content}
    onChange={v => u({ ...node, content: v })}
    placeholder="Type your static content here. Formatting (bold, italic, underline) will be supported via the inline editor."
    height={120}
  />
  <Label>Text alignment</Label>
  <Sel value={node.textAlign ?? 'left'} onChange={v => u({ ...node, textAlign: v as RichTextBlockNode['textAlign'] })}
    options={[
      { value: 'left',   label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right',  label: 'Right' },
    ]} fullWidth />
  <Label>Font size (px)</Label>
  <TextInput value={String(node.fontSize ?? 13)} onChange={v => u({ ...node, fontSize: parseInt(v) || 13 })} placeholder="13" />
</>);

// ── Label config editor ────────────────────────────────────────
// Controls how the field label appears in the printed report.

const POSITION_OPTIONS = [
  { value: 'adjacent', label: 'Adjacent — label left, value right' },
  { value: 'above',    label: 'Above — label on own line, value below' },
  { value: 'none',     label: 'None — value only, no label printed' },
];

const LabelConfigEditor: React.FC<{ config: LabelConfig; onChange: (c: LabelConfig) => void }> = ({ config, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <Label>Label position</Label>
    <Sel value={config.position} onChange={v => onChange({ ...config, position: v as LabelConfig['position'] })}
      options={POSITION_OPTIONS} fullWidth />

    {config.position !== 'none' && (<>
      <Label>Text transform</Label>
      <Sel value={config.transform ?? 'uppercase'} onChange={v => onChange({ ...config, transform: v as LabelConfig['transform'] })}
        options={[
          { value: 'uppercase',  label: 'UPPERCASE' },
          { value: 'capitalize', label: 'Capitalize' },
          { value: 'none',       label: 'As typed' },
        ]} fullWidth />

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Toggle
          checked={config.weight === 'bold'}
          onChange={v => onChange({ ...config, weight: v ? 'bold' : 'normal' })}
          label="Bold"
        />
        <Toggle
          checked={config.decoration === 'underline'}
          onChange={v => onChange({ ...config, decoration: v ? 'underline' : 'none' })}
          label="Underline"
        />
      </div>

      <Label>Font size (px)</Label>
      <TextInput
        value={String(config.fontSize ?? (config.position === 'above' ? 12 : 11))}
        onChange={v => onChange({ ...config, fontSize: parseInt(v) || 11 })}
        placeholder={config.position === 'above' ? '12' : '11'}
      />

      {/* Live preview */}
      <div style={{ marginTop: 8, padding: '8px 10px', background: '#ffffff', borderRadius: 5, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preview</div>
        {config.position === 'above' ? (
          <>
            <div style={{
              fontSize: config.fontSize ?? 12,
              fontWeight: config.weight === 'bold' ? 700 : 600,
              textDecoration: config.decoration === 'underline' ? 'underline' : 'none',
              textTransform: config.transform === 'uppercase' ? 'uppercase' : config.transform === 'capitalize' ? 'capitalize' : 'none',
              color: '#475569', marginBottom: 2,
            }}>
              Field label
            </div>
            <div style={{ fontSize: 13, color: '#0f172a' }}>Value text here</div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{
              fontSize: config.fontSize ?? 11,
              fontWeight: config.weight === 'bold' ? 700 : 600,
              textDecoration: config.decoration === 'underline' ? 'underline' : 'none',
              textTransform: config.transform === 'uppercase' ? 'uppercase' : config.transform === 'capitalize' ? 'capitalize' : 'none',
              color: '#475569', flexShrink: 0,
            }}>
              Field label
            </span>
            <span style={{ fontSize: 13, color: '#0f172a' }}>Value text here</span>
          </div>
        )}
      </div>
    </>)}
  </div>
);

const DropdownEditor: React.FC<{ node: DropdownNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Dropdown" />
  <Label>Binding key</Label>
  <TextInput value={node.bindingKey} onChange={v => u({ ...node, bindingKey: v })} placeholder="synoptic.grade" mono />
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
    <Toggle checked={node.multi ?? false}          onChange={v => u({ ...node, multi: v })}          label="Multi-select" />
    <Toggle checked={node.allowFreeText ?? false}  onChange={v => u({ ...node, allowFreeText: v })}  label="Allow free text" />
  </div>
  <Label>Options — one per line: value | label</Label>
  <Textarea
    value={(node.options ?? []).map(o => `${o.value}|${o.label}`).join('\n')}
    onChange={v => u({ ...node, options: v.split('\n').filter(Boolean).map(line => {
      const [val, lbl] = line.split('|');
      return { value: val?.trim() ?? '', label: lbl?.trim() ?? val?.trim() ?? '' };
    }) })}
    placeholder={"grade1|Grade 1\ngrade2|Grade 2"}
    height={100} mono
  />
</>);

const NumberEditor: React.FC<{ node: NumberNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Number + Unit" />
  <Label>Binding key</Label>
  <TextInput value={node.bindingKey} onChange={v => u({ ...node, bindingKey: v })} placeholder="synoptic.size" mono />
  <Row>
    <div style={{ flex: 1 }}>
      <Label>Unit</Label>
      <TextInput value={node.unit ?? ''} onChange={v => u({ ...node, unit: v })} placeholder="mm" />
    </div>
    <div style={{ flex: 1 }}>
      <Label>Decimal places</Label>
      <TextInput value={String(node.decimalPlaces ?? '')} onChange={v => u({ ...node, decimalPlaces: parseInt(v) || undefined })} placeholder="1" />
    </div>
  </Row>
  <Row>
    <div style={{ flex: 1 }}>
      <Label>Min</Label>
      <TextInput value={String(node.min ?? '')} onChange={v => u({ ...node, min: parseFloat(v) || undefined })} placeholder="0" />
    </div>
    <div style={{ flex: 1 }}>
      <Label>Max</Label>
      <TextInput value={String(node.max ?? '')} onChange={v => u({ ...node, max: parseFloat(v) || undefined })} placeholder="∞" />
    </div>
  </Row>
  <Label>Unit options (comma-separated)</Label>
  <TextInput value={(node.unitOptions ?? []).join(', ')}
    onChange={v => u({ ...node, unitOptions: v.split(',').map(s => s.trim()).filter(Boolean) })}
    placeholder="mm, cm" />
</>);

const DateEditor: React.FC<{ node: DateNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Date" />
  <Label>Binding key</Label>
  <TextInput value={node.bindingKey} onChange={v => u({ ...node, bindingKey: v })} placeholder="diagnostic.issuedDate" mono />
  <Label>Format</Label>
  <Sel value={node.format ?? 'date'} onChange={v => u({ ...node, format: v as DateNode['format'] })}
    options={[
      { value: 'date',     label: 'Date (DD/MM/YYYY)' },
      { value: 'datetime', label: 'Date + time' },
      { value: 'year',     label: 'Year only' },
    ]} fullWidth />
  <div style={{ marginTop: 8 }}>
    <Toggle checked={node.defaultToToday ?? false} onChange={v => u({ ...node, defaultToToday: v })} label="Default to today" />
  </div>
</>);

const ComputedEditor: React.FC<{ node: ComputedNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Computed" />
  <Label>Expression</Label>
  <Textarea value={node.expression} onChange={v => u({ ...node, expression: v })}
    placeholder="e.g. specimens.length + ' specimens submitted'" height={60} mono />
  <Label>Output type</Label>
  <Sel value={node.outputType ?? 'text'} onChange={v => u({ ...node, outputType: v as ComputedNode['outputType'] })}
    options={[
      { value: 'text',   label: 'Text' },
      { value: 'number', label: 'Number' },
      { value: 'date',   label: 'Date' },
    ]} fullWidth />
  <Label>Unit (appended to result)</Label>
  <TextInput value={node.unit ?? ''} onChange={v => u({ ...node, unit: v })} placeholder="e.g. mm" />
</>);

const StaticLabelEditor: React.FC<{ node: StaticLabelNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Static Label" />
  <Label>Text</Label>
  <Textarea value={node.text} onChange={v => u({ ...node, text: v })} height={56} />
  <Label>Variant</Label>
  <Sel value={node.variant ?? 'body'} onChange={v => u({ ...node, variant: v as StaticLabelNode['variant'] })}
    options={[
      { value: 'h1',      label: 'H1 — Large heading' },
      { value: 'h2',      label: 'H2 — Section heading' },
      { value: 'h3',      label: 'H3 — Sub-heading' },
      { value: 'body',    label: 'Body text' },
      { value: 'caption', label: 'Caption / footnote' },
    ]} fullWidth />
  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
    <Toggle checked={node.bold ?? false}   onChange={v => u({ ...node, bold: v })}   label="Bold" />
    <Toggle checked={node.italic ?? false} onChange={v => u({ ...node, italic: v })} label="Italic" />
  </div>
</>);

// ── Structure ──────────────────────────────────────────────────

const SectionEditor: React.FC<{ node: SectionNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Section" />
  <Label>Print heading</Label>
  <TextInput value={node.printHeading ?? ''} onChange={v => u({ ...node, printHeading: v })} placeholder="e.g. Gross Description" />
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
    <Toggle checked={node.collapsible ?? true}       onChange={v => u({ ...node, collapsible: v })}       label="Collapsible in editor" />
    <Toggle checked={node.defaultCollapsed ?? false} onChange={v => u({ ...node, defaultCollapsed: v })} label="Start collapsed" />
  </div>
  <Div label="AI Generation" />
  <AiConfigEditor config={node.ai ?? { enabled: false }} onChange={ai => u({ ...node, ai })} />
</>);

const RepeatGroupEditor: React.FC<{ node: RepeatGroupNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Repeat Group" />
  <Label>Iterate over (context array)</Label>
  <Sel value={node.iterateOver} onChange={v => u({ ...node, iterateOver: v })}
    options={[
      { value: 'specimens',       label: 'specimens' },
      { value: 'synopticReports', label: 'synopticReports' },
      { value: 'diagnoses',       label: 'diagnoses' },
    ]} fullWidth />
  <Label>Item alias (used in child binding keys)</Label>
  <TextInput value={node.itemAlias ?? 'item'} onChange={v => u({ ...node, itemAlias: v })} placeholder="specimen" mono />
  <Row>
    <div style={{ flex: 1 }}>
      <Label>Min items</Label>
      <TextInput value={String(node.minItems ?? '')} onChange={v => u({ ...node, minItems: parseInt(v) || undefined })} placeholder="0" />
    </div>
    <div style={{ flex: 1 }}>
      <Label>Max items</Label>
      <TextInput value={String(node.maxItems ?? '')} onChange={v => u({ ...node, maxItems: parseInt(v) || undefined })} placeholder="∞" />
    </div>
  </Row>
</>);

const ColumnLayoutEditor: React.FC<{ node: ColumnLayoutNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Column Layout" />
  <Label>Number of columns</Label>
  <div style={{ display: 'flex', gap: 6 }}>
    {([2, 3, 4] as const).map(n => (
      <button key={n} onClick={() => u({ ...node, numColumns: n })} style={{
        flex: 1, padding: '8px 4px', borderRadius: 6, cursor: 'pointer',
        border: `1.5px solid ${node.numColumns === n ? '#0891b2' : '#334155'}`,
        background: node.numColumns === n ? 'rgba(8,145,178,0.15)' : '#1e293b',
        color: node.numColumns === n ? '#0891b2' : '#64748b',
        fontSize: 11, fontWeight: 700,
      }}>
        <div style={{ fontSize: 16, marginBottom: 3 }}>
          {n === 2 ? '⫿' : n === 3 ? '|||' : '||||'}
        </div>
        {n} col{n > 1 ? 's' : ''}
      </button>
    ))}
  </div>
  <Label>Column gap (px)</Label>
  <TextInput value={String(node.columnGap ?? 16)} onChange={v => u({ ...node, columnGap: parseInt(v) || 16 })} placeholder="16" />
  <div style={{ fontSize: 10, color: '#334155', marginTop: 6 }}>
    Drop field components into each column slot on the canvas.
    Each column is {Math.round(100 / node.numColumns)}% wide.
  </div>
</>);

const TemplateRefEditor: React.FC<{ node: TemplateRefNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Template Reference" />
  <Label>Referenced template ID</Label>
  <TextInput value={node.refTemplateId} onChange={v => u({ ...node, refTemplateId: v })} placeholder="standard_surgical_pathology" mono />
  <Label>Display name (cached)</Label>
  <TextInput value={node.refTemplateName ?? ''} onChange={v => u({ ...node, refTemplateName: v })} placeholder="Auto-resolved" />
  <Div label="Context Overrides" />
  <Label>Key=value pairs, one per line</Label>
  <Textarea
    value={Object.entries(node.contextOverrides ?? {}).map(([k, v]) => `${k}=${v}`).join('\n')}
    onChange={raw => {
      const overrides: Record<string, string> = {};
      raw.split('\n').filter(Boolean).forEach(line => {
        const [k, ...rest] = line.split('=');
        if (k) overrides[k.trim()] = rest.join('=').trim();
      });
      u({ ...node, contextOverrides: overrides });
    }}
    placeholder={"specimenId={{specimen.id}}\ntemplateName=Breast Invasive"}
    height={72} mono
  />
</>);

const PageBreakEditor: React.FC<{ node: PageBreakNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Page Break" />
  <Label>Behaviour</Label>
  <Sel value={node.breakBehavior ?? 'always'} onChange={v => u({ ...node, breakBehavior: v as PageBreakNode['breakBehavior'] })}
    options={[
      { value: 'always', label: 'Always break here' },
      { value: 'avoid',  label: 'Avoid break here' },
      { value: 'auto',   label: 'Auto (browser decides)' },
    ]} fullWidth />
</>);

// ── Conditional ────────────────────────────────────────────────

const IfBlockEditor: React.FC<{ node: IfBlockNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="If / Show When" />
  <ExpressionBuilder
    expression={node.condition}
    onChange={condition => u({ ...node, condition })}
    title="Show children when"
  />
  <div style={{ marginTop: 8 }}>
    <Label>Else branch</Label>
    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
      Drop components into the Else zone on the canvas when one is added via the inspector.
      Else children: {(node.elseChildren ?? []).length} component(s).
    </div>
  </div>
</>);

const SwitchBlockEditor: React.FC<{ node: SwitchBlockNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Switch / Cases" />
  <Label>Switch on (context field)</Label>
  <TextInput value={node.switchOn} onChange={v => u({ ...node, switchOn: v })} placeholder="primarySynoptic.answers.grade" mono />
  <Div label="Cases" />
  {node.cases.map((c, i) => (
    <div key={c.id} style={{ ...S.exprBox, marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Case {i + 1}</span>
        <button onClick={() => u({ ...node, cases: node.cases.filter((_, idx) => idx !== i) })} style={S.rmBtn}>✕</button>
      </div>
      <Label>Label</Label>
      <TextInput value={c.label} onChange={v => u({ ...node, cases: node.cases.map((x, idx) => idx === i ? { ...x, label: v } : x) })} />
      <ExpressionBuilder
        expression={c.when}
        onChange={when => u({ ...node, cases: node.cases.map((x, idx) => idx === i ? { ...x, when } : x) })}
        title="When"
      />
    </div>
  ))}
  <button style={S.addBtn} onClick={() => u({ ...node, cases: [...node.cases, {
    id: crypto.randomUUID(), label: `Case ${node.cases.length + 1}`,
    when: { logic: 'AND', clauses: [] }, children: [],
  }] })}>
    + Add case
  </button>
</>);

const ExpressionValueEditor: React.FC<{ node: ExpressionValueNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Expression Value" />
  <Label>Template string</Label>
  <Textarea value={node.template} onChange={v => u({ ...node, template: v })}
    placeholder="{{patient.name}}, {{patient.age}} years old" height={56} mono />
  <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>
    Use {'{{field.path}}'} syntax. References dot-notation paths into StructuredContext.
  </div>
  <Label>Fallback (shown when expression is empty)</Label>
  <TextInput value={node.fallback ?? ''} onChange={v => u({ ...node, fallback: v })} placeholder="—" />
</>);

// ── Layout ─────────────────────────────────────────────────────

const HeaderEditor: React.FC<{ node: HeaderNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Header" />
  <Label>Page scope</Label>
  <Sel value={node.scope} onChange={v => u({ ...node, scope: v as HeaderNode['scope'] })}
    options={[
      { value: 'all',        label: 'All pages' },
      { value: 'page1',      label: 'Page 1 only' },
      { value: 'pages2plus', label: 'Pages 2+ only' },
    ]} fullWidth />
  <Label>Height (pts)</Label>
  <TextInput value={String(node.height ?? 90)} onChange={v => u({ ...node, height: parseInt(v) || 90 })} placeholder="90" />
  <Div label="Content" />
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <Toggle checked={node.showLogo ?? true}        onChange={v => u({ ...node, showLogo: v })}        label="Show institution logo" />
    <Toggle checked={node.showAccession ?? true}   onChange={v => u({ ...node, showAccession: v })}   label="Show accession number" />
    <Toggle checked={node.showPatientName ?? true} onChange={v => u({ ...node, showPatientName: v })} label="Show patient name" />
  </div>
  <Label>Custom HTML template (overrides above)</Label>
  <Textarea value={node.htmlTemplate ?? ''} onChange={v => u({ ...node, htmlTemplate: v })}
    placeholder="<div>{{institution.name}}</div>" height={72} mono />
</>);

const FooterEditor: React.FC<{ node: FooterNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Footer" />
  <Label>Page scope</Label>
  <Sel value={node.scope} onChange={v => u({ ...node, scope: v as FooterNode['scope'] })}
    options={[
      { value: 'all',        label: 'All pages' },
      { value: 'page1',      label: 'Page 1 only' },
      { value: 'pages2plus', label: 'Pages 2+ only' },
    ]} fullWidth />
  <Label>Height (pts)</Label>
  <TextInput value={String(node.height ?? 40)} onChange={v => u({ ...node, height: parseInt(v) || 40 })} placeholder="40" />
  <Div label="Content" />
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <Toggle checked={node.showPageNumbers ?? true} onChange={v => u({ ...node, showPageNumbers: v })} label="Show page numbers" />
  </div>
  {node.showPageNumbers && (<>
    <Label>Page number format</Label>
    <TextInput value={node.pageNumberFormat ?? 'Page {{page.number}} of {{page.total}}'}
      onChange={v => u({ ...node, pageNumberFormat: v })} mono />
  </>)}
  <Label>Custom HTML template (overrides above)</Label>
  <Textarea value={node.htmlTemplate ?? ''} onChange={v => u({ ...node, htmlTemplate: v })}
    placeholder="<div>Page {{page.number}}</div>" height={72} mono />
</>);

const ImageEmbedEditor: React.FC<{ node: ImageEmbedNode; u: (n: TemplateNode) => void }> = ({ node, u }) => (<>
  <Div label="Image Embed" />
  <Label>Static URL</Label>
  <TextInput value={node.src ?? ''} onChange={v => u({ ...node, src: v })} placeholder="https://…/logo.png" />
  <Label>Or binding key (dynamic URL from context)</Label>
  <TextInput value={node.bindingKey ?? ''} onChange={v => u({ ...node, bindingKey: v })} placeholder="institution.logoUrl" mono />
  <Label>Alt text</Label>
  <TextInput value={node.alt ?? ''} onChange={v => u({ ...node, alt: v })} placeholder="Institution logo" />
  <Label>Caption</Label>
  <TextInput value={node.caption ?? ''} onChange={v => u({ ...node, caption: v })} placeholder="Optional caption" />
  <Label>Alignment</Label>
  <Sel value={node.alignment ?? 'left'} onChange={v => u({ ...node, alignment: v as ImageEmbedNode['alignment'] })}
    options={[
      { value: 'left',   label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right',  label: 'Right' },
      { value: 'full',   label: 'Full width' },
    ]} fullWidth />
  <Row>
    <div style={{ flex: 1 }}>
      <Label>Width (px)</Label>
      <TextInput value={String(node.width ?? '')} onChange={v => u({ ...node, width: parseInt(v) || undefined })} placeholder="auto" />
    </div>
    <div style={{ flex: 1 }}>
      <Label>Height (px)</Label>
      <TextInput value={String(node.height ?? '')} onChange={v => u({ ...node, height: parseInt(v) || undefined })} placeholder="auto" />
    </div>
  </Row>
</>);

// ── Main inspector ─────────────────────────────────────────────

export const TemplateInspector: React.FC<Props> = ({ node, onUpdate }) => {
  if (!node) {
    return (
      <aside style={S.inspector}>
        <div style={S.header}><span style={S.title}>Inspector</span></div>
        <div style={S.empty}>
          <div style={{ fontSize: 28, opacity: 0.15 }}>⊙</div>
          <div style={{ fontSize: 12, color: '#334155', marginTop: 8 }}>Select a component to inspect</div>
        </div>
      </aside>
    );
  }

  const u = onUpdate;

  return (
    <aside style={S.inspector}>
      <div style={S.header}>
        <span style={S.title}>Inspector</span>
        <span style={S.typeTag}>{node.type}</span>
      </div>

      <div style={S.body}>
        {/* ── Base fields (all types) ── */}
        <Div label="General" />
        <Label>Label</Label>
        <TextInput value={node.label} onChange={v => u({ ...node, label: v })} />

        {/* Column width — drag handle on canvas is the primary way;
            this is the fallback for precise control */}
        <Label>Width</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <input
            type="range" min={1} max={12} step={1}
            value={node.colSpan ?? 12}
            onChange={e => u({ ...node, colSpan: parseInt(e.target.value) })}
            style={{ flex: 1, accentColor: '#0891b2' }}
          />
          <span style={{ fontSize: 11, color: '#64748b', minWidth: 40, textAlign: 'right' }}>
            {Math.round(((node.colSpan ?? 12) / 12) * 100)}%
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#1e293b', marginBottom: 8 }}>
          Drag the right edge of the component on the canvas to resize it visually.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0' }}>
          <Toggle checked={node.required ?? false}        onChange={v => u({ ...node, required: v })}        label="Required" />
          <Toggle checked={node.hideIfEmpty ?? false}     onChange={v => u({ ...node, hideIfEmpty: v })}     label="Hide if empty" />
          <Toggle checked={node.fhirExport ?? false}      onChange={v => u({ ...node, fhirExport: v })}      label="FHIR export" />
          <Toggle checked={node.pageBreakBefore ?? false} onChange={v => u({ ...node, pageBreakBefore: v })} label="Page break before" />
        </div>

        {/* ── Type-specific editors ── */}
        {node.type === 'text-field'       && <TextFieldEditor      node={node} u={u} />}
        {node.type === 'paragraph'        && <ParagraphEditor      node={node} u={u} />}
        {node.type === 'rich-text-block'  && <RichTextBlockEditor  node={node as RichTextBlockNode} u={u} />}
        {node.type === 'dropdown'         && <DropdownEditor       node={node} u={u} />}
        {node.type === 'number'           && <NumberEditor         node={node} u={u} />}
        {node.type === 'date'             && <DateEditor           node={node} u={u} />}
        {node.type === 'computed'         && <ComputedEditor       node={node} u={u} />}
        {node.type === 'static-label'     && <StaticLabelEditor    node={node} u={u} />}
        {node.type === 'section'          && <SectionEditor        node={node} u={u} />}
        {node.type === 'repeat-group'     && <RepeatGroupEditor    node={node} u={u} />}
        {node.type === 'column-layout'    && <ColumnLayoutEditor   node={node as ColumnLayoutNode} u={u} />}
        {node.type === 'template-ref'     && <TemplateRefEditor    node={node} u={u} />}
        {node.type === 'page-break'       && <PageBreakEditor      node={node} u={u} />}
        {node.type === 'if-block'         && <IfBlockEditor        node={node} u={u} />}
        {node.type === 'switch-block'     && <SwitchBlockEditor    node={node} u={u} />}
        {node.type === 'expression-value' && <ExpressionValueEditor node={node} u={u} />}
        {node.type === 'header'           && <HeaderEditor         node={node} u={u} />}
        {node.type === 'footer'           && <FooterEditor         node={node} u={u} />}
        {node.type === 'image-embed'      && <ImageEmbedEditor     node={node} u={u} />}

        {/* ── Label formatting (all types except containers) ── */}
        {!['section', 'column-layout', 'repeat-group', 'if-block', 'switch-block', 'header', 'footer', 'page-break', 'static-label', 'rich-text-block'].includes(node.type) && (
          <>
            <Div label="Label Formatting" />
            <LabelConfigEditor
              config={node.labelConfig ?? {
                position: ['paragraph'].includes(node.type) ? 'above' : 'adjacent',
                transform: 'uppercase',
                weight: 'normal',
                decoration: 'none',
              }}
              onChange={labelConfig => u({ ...node, labelConfig })}
            />
          </>
        )}

        {/* ── Visibility condition (all types) ── */}
        <Div label="Visibility Condition" />
        <ExpressionBuilder
          expression={node.showWhen ?? { logic: 'AND', clauses: [] }}
          onChange={expr => u({ ...node, showWhen: expr.clauses.length > 0 ? expr : undefined })}
          title="Show this component when"
        />
      </div>
    </aside>
  );
};

// ── Styles ─────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  inspector:  { width: 280, minWidth: 280, background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 },
  header:     { padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title:      { fontSize: 11, fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.06em', textTransform: 'uppercase' },
  typeTag:    { fontSize: 10, color: '#475569', fontFamily: 'monospace', background: '#1e293b', padding: '2px 6px', borderRadius: 4 },
  body:       { flex: 1, overflowY: 'auto', padding: '10px 14px 24px' },
  empty:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 },
  label:      { fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 10, marginBottom: 4 },
  divider:    { fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#334155', marginTop: 16, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #1e293b' },
  input:      { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 5, color: '#cbd5e1', fontSize: 12, padding: '6px 8px', boxSizing: 'border-box', outline: 'none' },
  select:     { background: '#1e293b', border: '1px solid #334155', borderRadius: 5, color: '#cbd5e1', fontSize: 11, padding: '5px 6px', outline: 'none', cursor: 'pointer' },
  toggleRow:  { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' },
  toggleLabel:{ fontSize: 12, color: '#94a3b8' },
  exprBox:    { background: '#111827', border: '1px solid #1e293b', borderRadius: 6, padding: '10px', display: 'flex', flexDirection: 'column', gap: 6 },
  exprHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  exprTitle:  { fontSize: 11, fontWeight: 600, color: '#64748b' },
  clauseRow:  { display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' },
  rmBtn:      { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: '2px 4px', flexShrink: 0 },
  addBtn:     { background: 'none', border: '1px dashed #334155', color: '#475569', cursor: 'pointer', fontSize: 11, padding: '5px 8px', borderRadius: 4, width: '100%', marginTop: 4 },
};
