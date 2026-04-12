import Link from "next/link";
import AuthButton from "./auth-button";

const Header = () => {
  return (
    <header className="flex justify-between items-center mb-20 mt-8">
      <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight">
        <Link href="/" className="hover:underline">
          TGV Mitglieder
        </Link>
        .
      </h2>
      <nav className="flex items-center gap-4">
        <AuthButton className="px-4 py-2 bg-[#b11217] text-white rounded-full text-sm font-medium hover:bg-[#8f0f13] transition-colors" />
      </nav>
    </header>
  );
};

export default Header;
