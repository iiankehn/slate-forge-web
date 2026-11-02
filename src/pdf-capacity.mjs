// A single PDF can now use the existing complete PDF workspace byte budget.
// Keep aggregate recovery/backup allocations bounded independently of page count.
export const PDF_FILE_LIMIT=40000000;
export const PDF_WORKSPACE_LIMIT=40000000;
export const PDF_FILE_BASE64_LIMIT=Math.ceil(PDF_FILE_LIMIT/3)*4;
