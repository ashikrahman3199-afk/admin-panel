const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/carts/page.tsx', 'utf8');

// Replace standard booking texts
content = content.replace(/Bookings/g, 'Carts');
content = content.replace(/bookings/g, 'carts');
content = content.replace(/Booking/g, 'Cart');
content = content.replace(/booking/g, 'cart');
content = content.replace(/setBookings/g, 'setCarts');
content = content.replace(/allBookings/g, 'allCarts');
content = content.replace(/setAllBookings/g, 'setAllCarts');

// Make it look different, we don't need status updates for Carts (it's just view-only)
// Or maybe we do? Let's simplify the table columns.

fs.writeFileSync('src/app/dashboard/carts/page.tsx', content);
