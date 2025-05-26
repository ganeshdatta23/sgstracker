import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* <header className="p-4 text-center font-bold">Guru Darshini</header> */}
      <main>{children}</main>
      {/* <footer className="p-4 text-center text-sm text-gray-400">© 2025</footer> */}
    </div>
  );
}
