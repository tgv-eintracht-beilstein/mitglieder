import Container from "@/app/_components/container";

export function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <Container>
        <div className="py-8 flex flex-col lg:flex-row items-center justify-between">
          <p className="text-sm text-neutral-600">
            © {new Date().getFullYear()} TGV Eintracht Beilstein. All rights reserved.
          </p>
          <p className="text-sm text-neutral-600 mt-4 lg:mt-0">
            Contact: info@example.com
          </p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
