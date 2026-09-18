import { useState, useEffect } from "react";
import { Search, User, ShoppingCart, LogOut, Menu, Settings } from "lucide-react";
import { NavLink } from "./NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { logoutUser, getCategories, getProducts, Category, Product } from "@/lib/localStorage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SearchBar from "./SearchBar";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    setCategories(getCategories());
    setAllProducts(getProducts());
  }, []);

  const handleUserClick = () => {
    if (!user) {
      navigate("/auth");
    }
  };

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/";
  };

  const getUserName = () => {
    return user?.full_name || user?.username || user?.email?.split("@")[0];
  };

  const getUserInitials = () => {
    const name = getUserName();
    if (!name) return "U";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3 md:py-4 bg-background">
          {/* Mobile menu + search buttons */}
          <div className="flex items-center gap-1 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-muted rounded-md transition-colors">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border">
                  <NavLink to="/" onClick={() => setMobileMenuOpen(false)}>
                    <img alt="Fabiana Lacerda - Véus e Personalizados" className="h-16 w-auto object-contain" src="/lovable-uploads/028c50b2-f5f1-47c0-9b8d-9d33fe48cf87.jpg" />
                  </NavLink>
                </div>
                <nav className="flex-1 overflow-y-auto p-4">
                  <ul className="space-y-1">
                    <li>
                      <NavLink to="/" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-foreground hover:bg-muted rounded-md transition-colors font-medium" activeClassName="bg-muted text-primary">
                        Home
                      </NavLink>
                    </li>
                    {categories.map((category) => (
                      <li key={category.id}>
                        {category.link_url ? (
                          <a
                            href={category.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-3 px-4 text-foreground hover:bg-muted rounded-md transition-colors font-medium"
                          >
                            {category.name}
                          </a>
                        ) : (
                          <NavLink
                            to={`/veus?categoria=${category.slug || category.id}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-3 px-4 text-foreground hover:bg-muted rounded-md transition-colors font-medium"
                            activeClassName="bg-muted text-primary"
                          >
                            {category.name}
                          </NavLink>
                        )}
                      </li>
                    ))}
                    <li>
                      <NavLink to="/grupo-vip" onClick={() => setMobileMenuOpen(false)} className="block py-3 px-4 text-foreground hover:bg-muted rounded-md transition-colors font-medium" activeClassName="bg-muted text-primary">
                        Grupo Vip
                      </NavLink>
                    </li>
                    <li className="pt-4 mt-2 border-t border-border">
                      <NavLink to="/admin-login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-3 px-4 text-muted-foreground hover:bg-muted rounded-md transition-colors text-sm">
                        <Settings className="w-4 h-4" />
                        Painel Admin
                      </NavLink>
                    </li>
                  </ul>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
            <button 
              onClick={() => setSearchOpen(!searchOpen)} 
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Desktop search */}
          <button 
            onClick={() => setSearchOpen(!searchOpen)} 
            className="hidden md:block p-2 hover:bg-muted rounded-md transition-colors"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>

          <NavLink to="/" className="flex items-center">
            <img alt="Fabiana Lacerda - Véus e Personalizados" className="h-24 md:h-36 w-auto object-contain" src="/lovable-uploads/bcd928c7-25e8-429a-a230-ca99c0da966c.png" />
          </NavLink>

          <div className="flex items-center gap-1 md:gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-muted rounded-full transition-colors">
                    <Avatar className="w-7 h-7 md:w-8 md:h-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="text-sm text-muted-foreground" disabled>
                    {getUserName()}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button onClick={handleUserClick} className="p-2 hover:bg-muted rounded-md transition-colors">
                <User className="w-5 h-5 text-foreground" />
              </button>
            )}
            <button className="p-2 hover:bg-muted rounded-md transition-colors">
              <ShoppingCart className="w-5 h-5 text-foreground" />
            </button>
            <NavLink to="/admin-login" className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground" title="Painel Admin">
              <Settings className="w-4 h-4" />
            </NavLink>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:block border-t border-border">
          <ul className="flex items-center justify-center gap-4 lg:gap-8 py-4 text-sm">
            <li>
              <NavLink to="/" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap" activeClassName="text-primary">
                Home
              </NavLink>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                {category.link_url ? (
                  <a
                    href={category.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap"
                  >
                    {category.name}
                  </a>
                ) : (
                  <NavLink
                    to={`/veus?categoria=${category.slug || category.id}`}
                    className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap"
                    activeClassName="text-primary"
                  >
                    {category.name}
                  </NavLink>
                )}
              </li>
            ))}
            <li>
              <NavLink to="/grupo-vip" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap" activeClassName="text-primary">
                Grupo Vip
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      {searchOpen && (
        <SearchBar products={allProducts} onClose={() => setSearchOpen(false)} />
      )}
    </header>
  );
};

export default Header;
