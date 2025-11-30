import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  // ⬇ Primero el preset recomendado
  pluginJs.configs.recommended,

  // ⬇ Luego tu configuración personalizada (ESTA TIENE PRIORIDAD)
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
      ecmaVersion: "latest",
    },
    rules: {
      "no-unused-vars": "warn",   // ahora sí domina SOBRE el preset
      "no-undef": "error",
      "no-mixed-spaces-and-tabs": "warn"
    },
  },
];
