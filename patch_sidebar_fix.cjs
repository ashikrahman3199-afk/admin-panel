const fs = require('fs');
let content = fs.readFileSync('src/components/sidebar.tsx', 'utf8');

content = content.replace('import { ShoppingCart, usePathname } from "next/navigation";', 'import { usePathname } from "next/navigation";');
content = content.replace('LayoutDashboard,', 'ShoppingCart, LayoutDashboard,');

fs.writeFileSync('src/components/sidebar.tsx', content);
