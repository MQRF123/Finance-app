'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/simulaciones', label: 'Simulaciones' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-r w-64">
      <div className="p-4">
        <ul>
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
