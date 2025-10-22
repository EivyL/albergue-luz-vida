export const ROLE_MAP = {
    1: "ADMIN",
    2: "STAFF",
    3: "COORD",
    4: "TSOCIAL",
    5: "INV",
    6: "COMPRAS",
    7: "PROD",
    8: "LECTOR",
  };
  
  export const roleCode = (num) => ROLE_MAP?.[num] || String(num || "");
  