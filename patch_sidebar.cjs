const fs = require('fs');
let content = fs.readFileSync('src/components/sidebar.tsx', 'utf8');

if (!content.includes('ShoppingCart')) {
    content = content.replace('import {', 'import { ShoppingCart,');
    
    // add link
    content = content.replace(
        '{ icon: FileText, label: "Bookings", href: "/dashboard/bookings" },',
        '{ icon: FileText, label: "Bookings", href: "/dashboard/bookings" },\n    { icon: ShoppingCart, label: "Active Carts", href: "/dashboard/carts" },'
    );
}

fs.writeFileSync('src/components/sidebar.tsx', content);
