export const narrativeTemplateConfig = {
  templateId: "default_narrative_template",
  name: "Default Narrative Template",

  orchestratorEnabled: true,

  sections: [
    {
      id: "admin_header",
      title: "Administrative & Clinical Header",
      enabled: true,
      order: 1,
      aiInstruction:
        "Use these fields only as contextual information. Do not rewrite or restate them unless explicitly asked.",
      fields: [
        { name: "Patient Demographics", cardinality: "Many-to-One" },
        { name: "Accession Number", cardinality: "One-to-One" },
        { name: "Ordering Physician", cardinality: "Many-to-One" },
        { name: "Clinical History", cardinality: "One-to-One" },
        { name: "Pre-Operative Diagnosis", cardinality: "One-to-One" }
      ]
    },

    {
      id: "gross_description",
      title: "Specimen & Gross Description",
      enabled: true,
      order: 2,
      aiInstruction:
        "Summarize the gross findings using the structured fields. Do not invent measurements or specimen parts.",
      fields: [
        { name: "Specimen Label/Source", cardinality: "Many-to-One" },
        { name: "Procedure", cardinality: "Many-to-One" },
        { name: "Gross Measurements", cardinality: "Many-to-One" },
        { name: "Tissue Integrity", cardinality: "Many-to-One" },
        { name: "Block Index", cardinality: "Many-to-One" }
      ]
    },

    {
      id: "synoptic_summary",
      title: "Synoptic Data Summary",
      enabled: true,
      order: 3,
      aiInstruction:
        "Summarize the synoptic data in narrative form. Do not alter or reinterpret discrete values. Do not infer staging or diagnosis.",
      fields: [
        { name: "Histologic Type", cardinality: "One-to-One" },
        { name: "Histologic Grade", cardinality: "One-to-One" },
        { name: "Tumor Size", cardinality: "One-to-One" },
        { name: "Margin Status", cardinality: "Many-to-One" },
        { name: "Lymphovascular Invasion", cardinality: "One-to-One" },
        { name: "pTNM Stage", cardinality: "One-to-One" },
        { name: "Lymph Node Status", cardinality: "Many-to-One" }
      ]
    },

    {
      id: "ancillary_and_diagnosis",
      title: "Ancillary Testing & Final Diagnosis",
      enabled: true,
      order: 4,
      aiInstruction:
        "Draft a clear, concise narrative incorporating IHC and molecular results. Do not invent findings. Final Diagnosis must reflect structured data or pathologist input.",
      fields: [
        { name: "Immunohistochemistry (IHC)", cardinality: "Many-to-One" },
        { name: "Molecular/Cytogenetics", cardinality: "Many-to-One" },
        { name: "Final Diagnosis", cardinality: "One-to-One" },
        { name: "Comment/Note", cardinality: "One-to-One" }
      ]
    }
  ]
};