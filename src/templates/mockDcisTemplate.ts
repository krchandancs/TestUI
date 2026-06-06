import { TemplateDefinition } from "../types/templateTypes";

export const mockDcisTemplate: TemplateDefinition = {
  id: "dcis_resection",
  displayName: "Breast DCIS Resection",
  source: "CAP",
  sourceVersion: "4.2",
  sections: [
    {
      id: "tumor",
      title: "Tumor Characteristics",
      questions: [
        {
          id: "tumor_size",
          text: "Tumor Size",
          type: "text"
        },
        {
          id: "grade",
          text: "Nuclear Grade",
          type: "choice",
          multiple: false,
          options: [
            { id: "g1", label: "Grade 1" },
            { id: "g2", label: "Grade 2" },
            { id: "g3", label: "Grade 3" }
          ]
        }
      ]
    }
  ]
};
