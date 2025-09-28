// Ambient module declarations for alternate SheetJS entry points used in dynamic import fallbacks.
// These re-export the primary 'xlsx' module typings to satisfy TypeScript when using
// 'xlsx/xlsx.mjs' and 'xlsx/dist/xlsx.full.min.js' paths.

declare module 'xlsx/xlsx.mjs' {
  import * as XLSX from 'xlsx';
  export = XLSX;
}

declare module 'xlsx/dist/xlsx.full.min.js' {
  import * as XLSX from 'xlsx';
  export = XLSX;
}
