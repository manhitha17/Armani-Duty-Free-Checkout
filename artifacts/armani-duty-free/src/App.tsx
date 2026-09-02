import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  CreditCard,
  Info,
  Minus,
  Plus,
  Radio,
  ScanLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  getGetFeaturedProductsQueryKey,
  getGetStoreStatusQueryKey,
  getListCatalogQueryKey,
  type CartLineInput,
  type CartQuote,
  type CheckoutResult,
  type Product,
  useCompleteCheckout,
  useGetFeaturedProducts,
  useGetStoreStatus,
  useListCatalog,
  useQuoteCart,
  useScanRfid,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, useParams, Router as WouterRouter, Link } from 'wouter';

const queryClient = new QueryClient();
const money = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type BasketLine = { product: Product; quantity: number };

function usePersistedBasket() {
  const [basket, setBasket] = useState<BasketLine[]>(() => {
    try { return JSON.parse(localStorage.getItem('armani-basket') ?? '[]') as BasketLine[]; } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('armani-basket', JSON.stringify(basket)); }, [basket]);
  const add = (product: Product) => setBasket((current) => {
    const existing = current.find((line) => line.product.id === product.id);
    if (existing) return current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
    return [...current, { product, quantity: 1 }];
  });
  const remove = (id: string) => setBasket((current) => current.filter((line) => line.product.id !== id));
  const adjust = (id: string, change: number) => setBasket((current) => current.map((line) => line.product.id === id ? { ...line, quantity: Math.max(1, line.quantity + change) } : line));
  const clear = () => setBasket([]);
  return { basket, add, remove, adjust, clear };
}

function Header({ count, onBasket }: { count: number; onBasket: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className="bg-[hsl(var(--primary))] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--secondary))]" data-testid="status-airport">
        Complimentary collection after security · Terminal 3 departures
      </div>
      <header className="relative z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.96)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 lg:px-10">
          <Link href="/" className="group flex items-center gap-3" data-testid="link-home">
            <span className="flex h-10 w-10 items-center justify-center border border-[hsl(var(--primary))] text-[hsl(var(--primary))]">
              <span className="font-serif text-xl italic">A</span>
            </span>
            <span className="hidden sm:block">
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.25em] text-[hsl(var(--primary))]">Armani</span>
              <span className="mono-label mt-1 block text-[hsl(var(--muted-foreground))]">Duty Free</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <Link href="/#catalog" className="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--foreground))] transition-colors hover:text-[hsl(var(--accent-foreground))]" data-testid="link-shop">Shop all</Link>
            <Link href="/#fragrance" className="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]" data-testid="link-fragrance">Fragrance</Link>
            <Link href="/#beauty" className="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]" data-testid="link-beauty">Beauty</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onBasket} className="relative flex h-11 items-center gap-2 border border-[hsl(var(--primary))] bg-[hsl(var(--primary))] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[hsl(var(--background))] transition-transform hover:-translate-y-0.5" data-testid="button-open-basket">
              <ShoppingBag size={16} strokeWidth={1.7} /><span className="hidden sm:inline">Basket</span>
              <span className="flex h-5 min-w-5 items-center justify-center bg-[hsl(var(--secondary))] px-1 text-[10px] text-[hsl(var(--primary))]" data-testid="text-basket-count">{count}</span>
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="ml-1 flex h-10 w-10 items-center justify-center border border-[hsl(var(--border))] md:hidden" aria-label="Open menu" data-testid="button-mobile-menu"><ChevronDown size={17} className={menuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
          </div>
        </div>
        {menuOpen && <div className="border-t border-[hsl(var(--border))] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-[0.16em]">
            <Link href="/#catalog" onClick={() => setMenuOpen(false)} data-testid="link-mobile-shop">Shop all</Link>
            <Link href="/#fragrance" onClick={() => setMenuOpen(false)} data-testid="link-mobile-fragrance">Fragrance</Link>
            <Link href="/#beauty" onClick={() => setMenuOpen(false)} data-testid="link-mobile-beauty">Beauty</Link>
          </div>
        </div>}
      </header>
    </>
  );
}

function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[hsl(var(--muted))] ${large ? 'min-h-[360px] lg:min-h-[490px]' : 'aspect-[4/5]'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,hsl(var(--secondary)/.55),transparent_38%),linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]" />
      {product.image && <img src={product.image} alt={product.name} className="product-image relative z-10 max-h-[82%] max-w-[78%] object-contain mix-blend-multiply" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} data-testid={`img-product-${product.id}`} />}
      <span className="absolute bottom-4 left-4 z-10 mono-label text-[hsl(var(--primary)/.55)]">{product.size}</span>
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => { onAdd(product); setAdded(true); window.setTimeout(() => setAdded(false), 1400); };
  return (
    <article className="product-card group relative border border-[hsl(var(--border))] bg-[hsl(var(--card))]" data-testid={`card-product-${product.id}`}>
      {product.badge && <span className="absolute left-3 top-3 z-20 bg-[hsl(var(--secondary))] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--primary))]" data-testid={`badge-product-${product.id}`}>{product.badge}</span>}
      <ProductVisual product={product} />
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="mono-label mb-1 text-[hsl(var(--muted-foreground))]">{product.brand}</p>
            <h3 className="text-sm font-bold leading-snug text-[hsl(var(--foreground))]" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold text-[hsl(var(--foreground))]" data-testid={`text-price-${product.id}`}>{money(product.price)}</p>
            {product.compareAtPrice > product.price && <p className="text-[10px] text-[hsl(var(--muted-foreground))] line-through">{money(product.compareAtPrice)}</p>}
          </div>
        </div>
        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{product.description}</p>
        <button onClick={handleAdd} className={`flex w-full items-center justify-center gap-2 border py-3 text-[10px] font-extrabold uppercase tracking-[0.17em] transition-all ${added ? 'border-[hsl(var(--secondary))] bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--background))]'}`} data-testid={`button-add-${product.id}`}>
          {added ? <><Check size={14} /> Added</> : <><Plus size={14} /> Add to basket</>}
        </button>
      </div>
    </article>
  );
}

function BasketDrawer({ basket, open, onClose, onAdjust, onRemove }: { basket: BasketLine[]; open: boolean; onClose: () => void; onAdjust: (id: string, change: number) => void; onRemove: (id: string) => void }) {
  const count = basket.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = basket.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  if (!open) return null;
  return <div className="fixed inset-0 z-50">
    <button className="absolute inset-0 cursor-default bg-[hsl(var(--primary)/.35)] backdrop-blur-[2px]" onClick={onClose} aria-label="Close basket overlay" data-testid="button-close-basket-overlay" />
    <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-[hsl(var(--card))] shadow-2xl reveal" data-testid="panel-basket">
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-5">
        <div><p className="mono-label text-[hsl(var(--muted-foreground))]">Your selection</p><h2 className="display-serif mt-1 text-3xl italic">Basket <span className="font-sans text-sm not-italic text-[hsl(var(--muted-foreground))]">({count})</span></h2></div>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-[hsl(var(--border))]" aria-label="Close basket" data-testid="button-close-basket"><X size={17} /></button>
      </div>
      {basket.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--primary))]"><ShoppingBag size={25} strokeWidth={1.2} /></div>
        <h3 className="display-serif text-2xl italic">Nothing packed yet</h3><p className="mt-2 max-w-xs text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">Your carefully selected pieces will appear here, ready for collection at the gate.</p>
        <button onClick={onClose} className="mt-6 border border-[hsl(var(--primary))] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em]" data-testid="button-continue-shopping">Continue shopping</button>
      </div> : <>
        <div className="flex-1 space-y-1 overflow-y-auto px-6 py-4">
          {basket.map((line) => <div className="flex gap-4 border-b border-[hsl(var(--border))] py-4" key={line.product.id} data-testid={`row-basket-${line.product.id}`}>
            <div className="h-24 w-20 shrink-0"><ProductVisual product={line.product} /></div>
            <div className="min-w-0 flex-1"><p className="mono-label text-[hsl(var(--muted-foreground))]">{line.product.brand}</p><h3 className="mt-1 text-sm font-bold">{line.product.name}</h3><p className="mt-1 text-sm font-semibold">{money(line.product.price)}</p>
              <div className="mt-3 flex items-center justify-between"><div className="flex items-center border border-[hsl(var(--border))]"><button onClick={() => onAdjust(line.product.id, -1)} className="flex h-7 w-7 items-center justify-center" aria-label="Decrease quantity" data-testid={`button-decrease-${line.product.id}`}><Minus size={12} /></button><span className="w-7 text-center text-xs" data-testid={`text-quantity-${line.product.id}`}>{line.quantity}</span><button onClick={() => onAdjust(line.product.id, 1)} className="flex h-7 w-7 items-center justify-center" aria-label="Increase quantity" data-testid={`button-increase-${line.product.id}`}><Plus size={12} /></button></div><button onClick={() => onRemove(line.product.id)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]" data-testid={`button-remove-${line.product.id}`}><Trash2 size={12} /> Remove</button></div>
            </div>
          </div>)}
        </div>
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/.45)] px-6 py-6">
          <div className="mb-4 flex items-center justify-between text-sm"><span className="text-[hsl(var(--muted-foreground))]">Estimated total</span><strong className="text-lg" data-testid="text-basket-subtotal">{money(subtotal)}</strong></div>
          <p className="mb-4 flex items-start gap-2 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]"><Info size={14} className="mt-0.5 shrink-0" /> Final duty-free savings are calculated once you add your destination and flight.</p>
          <Link href="/checkout" onClick={onClose} className="flex w-full items-center justify-center gap-2 bg-[hsl(var(--primary))] py-4 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[hsl(var(--background))] transition-transform hover:-translate-y-0.5" data-testid="link-checkout">Continue to checkout <ArrowRight size={15} /></Link>
        </div>
      </>}
    </aside>
  </div>;
}

function StoreContext() {
  const { data, isLoading, isError, refetch } = useGetStoreStatus({ query: { queryKey: getGetStoreStatusQueryKey() } });
  if (isLoading) return <div className="h-20 animate-pulse bg-[hsl(var(--muted))]" data-testid="skeleton-store-status" />;
  if (isError || !data) return <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 text-xs lg:px-10"><span className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]"><CircleAlert size={15} /> Store details unavailable</span><button onClick={() => refetch()} className="font-bold underline" data-testid="button-retry-store">Retry</button></div>;
  return <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 px-5 py-4 text-[11px] lg:grid-cols-4 lg:px-10" data-testid="status-store-context">
    <div><span className="mono-label text-[hsl(var(--muted-foreground))]">Location</span><p className="mt-1 font-bold">{data.location} · {data.terminal}</p></div>
    <div><span className="mono-label text-[hsl(var(--muted-foreground))]">Next departure</span><p className="mt-1 font-bold">{data.nextFlight}</p></div>
    <div><span className="mono-label text-[hsl(var(--muted-foreground))]">Collection point</span><p className="mt-1 font-bold">{data.collectionPoint}</p></div>
    <div className="flex items-center gap-2 lg:justify-end"><span className={`h-2 w-2 rounded-full ${data.open ? 'bg-[hsl(var(--secondary))]' : 'bg-[hsl(var(--destructive))]'}`} /><span className="font-bold">{data.open ? 'Open now' : 'Currently closed'}</span></div>
  </div>;
}

function HomePage({ onAdd, onBasket, count }: { onAdd: (product: Product) => void; onBasket: () => void; count: number }) {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const params = useMemo(() => ({ ...(category !== 'All' ? { category } : {}), ...(search ? { search } : {}) }), [category, search]);
  const { data: featured, isLoading: featuredLoading } = useGetFeaturedProducts({ query: { queryKey: getGetFeaturedProductsQueryKey() } });
  const { data: products, isLoading, isError, refetch } = useListCatalog(params, { query: { queryKey: getListCatalogQueryKey(params) } });
  const hero = featured?.[0] ?? products?.[0];
  const categories = ['All', 'Fragrance', 'Makeup', 'Skincare', 'Gifting'];
  return <div className="armani-shell min-h-[100dvh]">
    <Header count={count} onBasket={onBasket} />
    <section className="quiet-grid overflow-hidden border-b border-[hsl(var(--border))]">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.05fr_.95fr]">
        <div className="flex min-h-[560px] flex-col justify-between px-5 py-12 sm:px-10 sm:py-16 lg:min-h-[620px] lg:px-16 lg:py-20">
          <div className="reveal"><p className="mono-label mb-6 flex items-center gap-3 text-[hsl(var(--accent-foreground))]"><span className="h-px w-8 bg-[hsl(var(--accent-foreground))]" /> Curated for the journey</p>
            <h1 className="max-w-2xl text-[clamp(3.5rem,8vw,7.9rem)] font-medium leading-[.88] tracking-[-.07em] text-[hsl(var(--primary))]">The art<br /><span className="display-serif italic">of leaving</span><br />well.</h1>
            <p className="mt-8 max-w-sm text-sm leading-7 text-[hsl(var(--muted-foreground))]">A considered edit of Armani beauty, prepared for departure. Discover your signature before the sky.</p>
          </div>
          <div className="reveal reveal-delay-2 flex flex-wrap items-center gap-4 pt-10"><a href="#catalog" className="flex items-center gap-3 bg-[hsl(var(--primary))] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[hsl(var(--background))]" data-testid="link-browse-collection">Browse the collection <ArrowRight size={15} /></a><span className="mono-label text-[hsl(var(--muted-foreground))]">01 — 04</span></div>
        </div>
        <div className="relative flex min-h-[520px] items-end overflow-hidden bg-[hsl(var(--primary))] lg:min-h-[620px]">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 60% 35%, hsl(40 72% 63% / .7), transparent 33%), linear-gradient(115deg, transparent 40%, hsl(35 28% 94% / .12) 40.2%, transparent 40.5%)' }} />
          <div className="absolute left-7 top-8 z-10 flex items-center gap-2 text-[hsl(var(--background)/.7)]"><Sparkles size={14} /><span className="mono-label">Milan · New York · Tokyo</span></div>
          {featuredLoading || !hero ? <div className="mx-auto mb-20 h-72 w-56 animate-pulse bg-[hsl(var(--primary-foreground)/.1)]" data-testid="skeleton-hero-product" /> : <div className="relative z-10 mx-auto mb-12 w-[72%] max-w-[410px]"><ProductVisual product={hero} large /><div className="absolute -bottom-6 -left-6 bg-[hsl(var(--secondary))] px-5 py-4 text-[hsl(var(--primary))]"><p className="mono-label">The signature</p><p className="mt-1 max-w-[150px] text-sm font-bold leading-snug">{hero.name}</p></div></div>}
           <div className="absolute bottom-8 right-8 text-right text-[hsl(var(--background)/.65)]"><p className="mono-label">Terminal 3</p><p className="mt-1 text-xs">Your time, beautifully spent.</p></div>
        </div>
      </div>
    </section>
    <StoreContext />
    <section id="catalog" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 lg:px-16 lg:py-24">
      <div className="mb-10 flex flex-col justify-between gap-7 border-b border-[hsl(var(--border))] pb-7 lg:flex-row lg:items-end"><div><p className="mono-label mb-3 text-[hsl(var(--accent-foreground))]">The edit / 01</p><h2 className="display-serif text-5xl italic tracking-[-.04em] sm:text-6xl">Find your <span className="not-italic">note.</span></h2></div><div className="flex w-full max-w-sm items-center border-b border-[hsl(var(--primary))] pb-2"><Search size={16} className="mr-2 text-[hsl(var(--muted-foreground))]" /><input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search fragrance, beauty..." className="w-full bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]" data-testid="input-catalog-search" /></div></div>
      <div className="mb-10 flex gap-2 overflow-x-auto pb-1" role="tablist">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 border px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] transition-colors ${category === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--background))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]'}`} data-testid={`button-category-${item.toLowerCase()}`}>{item}</button>)}</div>
      {isLoading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"><div className="col-span-2 aspect-[1.5] animate-pulse bg-[hsl(var(--muted))] lg:col-span-2" /><div className="aspect-[4/5] animate-pulse bg-[hsl(var(--muted))]" /><div className="aspect-[4/5] animate-pulse bg-[hsl(var(--muted))]" /></div> : isError ? <div className="border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.5)] px-6 py-16 text-center"><CircleAlert className="mx-auto mb-4" /><h3 className="display-serif text-2xl italic">The collection is taking a moment.</h3><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Please try again before your boarding call.</p><button onClick={() => refetch()} className="mt-5 border border-[hsl(var(--primary))] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.16em]" data-testid="button-retry-catalog">Try again</button></div> : !products?.length ? <div className="border border-dashed border-[hsl(var(--border))] px-6 py-20 text-center" data-testid="empty-catalog"><Search className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" /><h3 className="display-serif text-2xl italic">No such note.</h3><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Try another search or return to the full edit.</p><button onClick={() => { setSearch(''); setCategory('All'); }} className="mt-5 font-bold underline" data-testid="button-reset-catalog">Reset the edit</button></div> : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => <div key={product.id} className={`${index === 0 ? 'col-span-2 md:col-span-2' : ''} reveal reveal-delay-${Math.min(index % 4 + 1, 3)}`}><ProductCard product={product} onAdd={onAdd} /></div>)}
      </div>}
    </section>
    <section id="fragrance" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--primary))] text-[hsl(var(--background))]"><div className="mx-auto grid max-w-[1440px] lg:grid-cols-[.8fr_1.2fr]"><div className="flex flex-col justify-between px-5 py-16 sm:px-10 lg:px-16 lg:py-24"><div><p className="mono-label mb-5 text-[hsl(var(--secondary))]">A small ritual</p><h2 className="display-serif max-w-lg text-5xl leading-[.95] italic sm:text-6xl">Make the in-between feel like <span className="not-italic">somewhere.</span></h2></div><p className="mt-12 max-w-sm text-sm leading-7 text-[hsl(var(--background)/.65)]">From the first mist to the final gate call, fragrance gives the journey a point of view.</p></div><div className="grid grid-cols-2 border-l border-[hsl(var(--background)/.18)]"><div className="flex min-h-64 items-end border-b border-r border-[hsl(var(--background)/.18)] p-6 lg:min-h-80"><span className="display-serif text-7xl italic text-[hsl(var(--secondary)/.8)]">Sì</span></div><div className="flex min-h-64 items-end border-b border-[hsl(var(--background)/.18)] p-6 lg:min-h-80"><span className="display-serif text-7xl italic text-[hsl(var(--accent)/.8)]">My</span></div><div className="col-span-2 flex items-center justify-between p-6"><span className="mono-label text-[hsl(var(--background)/.6)]">Armani / fragrance house</span><ArrowRight size={20} className="text-[hsl(var(--secondary))]" /></div></div></div></section>
    <section id="beauty" className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-5 py-16 sm:px-10 lg:flex-row lg:items-end lg:px-16 lg:py-24"><div><p className="mono-label mb-4 text-[hsl(var(--accent-foreground))]">Departure note</p><h2 className="max-w-xl text-4xl font-medium leading-tight tracking-[-.04em] sm:text-5xl">A beautiful thing to take with you.</h2></div><div className="max-w-sm"><p className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">Duty-free, not detail-free. Every piece is wrapped for the cabin and ready at collection.</p><Link href="/checkout" className="mt-6 inline-flex items-center gap-3 border-b border-[hsl(var(--primary))] pb-2 text-[10px] font-extrabold uppercase tracking-[0.16em]" data-testid="link-start-checkout">Go to checkout <ArrowRight size={15} /></Link></div></section>
    <Footer />
  </div>;
}

function Footer() {
   return <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/.55)]"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-5 py-10 sm:px-10 lg:flex-row lg:items-end lg:px-16"><div><div className="mb-4 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center border border-[hsl(var(--primary))] font-serif italic">A</span><span className="text-[11px] font-extrabold uppercase tracking-[0.22em]">Armani Duty Free</span></div><p className="max-w-xs text-xs leading-6 text-[hsl(var(--muted-foreground))]">A quieter way to shop between here and there.</p></div><div className="text-left lg:text-right"><p className="mono-label text-[hsl(var(--muted-foreground))]">Need a hand?</p><p className="mt-2 text-sm font-bold">Find a beauty advisor in Terminal 3</p></div></div></footer>;
}

function CheckoutPage({ basket, onAdd, onRemove, onClear }: { basket: BasketLine[]; onAdd: (product: Product) => void; onRemove: (id: string) => void; onClear: () => void }) {
  const [, setLocation] = useLocation();
  const [destination, setDestination] = useState('Japan');
  const [flightTime, setFlightTime] = useState('Today, 18:45');
  const [flightNumber, setFlightNumber] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [tagId, setTagId] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [scannedTag, setScannedTag] = useState('');
  const [readerConnected, setReaderConnected] = useState(false);
  const [readerBusy, setReaderBusy] = useState(false);
  const [step, setStep] = useState(1);
  const quoteMutation = useQuoteCart();
  const scanMutation = useScanRfid();
  const checkoutMutation = useCompleteCheckout();
  const items: CartLineInput[] = useMemo(() => basket.map((line) => ({ productId: line.product.id, quantity: line.quantity })), [basket]);
  const quote = quoteMutation.data as CartQuote | undefined;
  const refreshQuote = () => { if (items.length) quoteMutation.mutate({ data: { items, destination, flightTime } }); };
  useEffect(() => { if (items.length) refreshQuote(); }, [destination, flightTime, items]);
  useEffect(() => { if (quote?.eligible) setStep(email && flightNumber ? 3 : 2); }, [quote, email, flightNumber]);
  const scanTag = (value: string) => { const normalizedTag = value.trim(); if (!normalizedTag) return; setScanMessage(''); scanMutation.mutate({ data: { tagId: normalizedTag, device: readerConnected ? 'web-serial-reader' : 'self-checkout-01' } }, { onSuccess: (result) => { setScannedTag(result.tagId); setScanMessage(result.message); if (result.found && result.product) { const already = basket.some((line) => line.product.id === result.product?.id); if (!already) onAdd(result.product); } setTagId(''); }, onError: () => setScanMessage('We could not read that tag. Check the code and try once more.') }); };
  const scan = (event: FormEvent) => { event.preventDefault(); scanTag(tagId); };
  const connectReader = async () => {
    const serial = (navigator as Navigator & { serial?: { requestPort: () => Promise<{ open: (options: { baudRate: number }) => Promise<void>; readable?: ReadableStream<Uint8Array>; close: () => Promise<void> }> } }).serial;
    if (!serial) { setScanMessage('This browser cannot connect to a reader. Enter the tag ID below instead.'); return; }
    try {
      const port = await serial.requestPort();
      await port.open({ baudRate: 9600 });
      setReaderConnected(true);
      setReaderBusy(true);
      setScanMessage('Reader connected. Place a tagged item on the reader.');
      const reader = port.readable?.getReader();
      if (!reader) { setReaderBusy(false); return; }
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n/);
        buffer = parts.pop() ?? '';
        parts.forEach((part) => scanTag(part));
      }
      reader.releaseLock();
      await port.close();
    } catch {
      setScanMessage('Reader connection was cancelled. You can still enter a tag ID manually.');
    } finally {
      setReaderBusy(false);
      setReaderConnected(false);
    }
  };
  const complete = (event: FormEvent) => { event.preventDefault(); if (!items.length || !quote?.eligible) return; checkoutMutation.mutate({ data: { items, destination, flightNumber, email, paymentMethod } }, { onSuccess: (result) => { localStorage.setItem('armani-last-order', JSON.stringify(result)); onClear(); setLocation(`/order/${result.orderId}`); } }); };
  if (!basket.length) return <div className="armani-shell min-h-[100dvh]"><Header count={0} onBasket={() => setLocation('/')} /><main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center"><div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--muted))]"><ShoppingBag size={30} strokeWidth={1.2} /></div><p className="mono-label text-[hsl(var(--muted-foreground))]">Self-checkout</p><h1 className="display-serif mt-3 text-5xl italic">Your basket is light.</h1><p className="mt-4 text-sm leading-7 text-[hsl(var(--muted-foreground))]">Choose something beautiful before you begin your departure details.</p><Link href="/#catalog" className="mt-8 bg-[hsl(var(--primary))] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[hsl(var(--background))]" data-testid="link-return-to-catalog">Return to collection</Link></main></div>;
  return <div className="armani-shell min-h-[100dvh]"><Header count={basket.reduce((sum, line) => sum + line.quantity, 0)} onBasket={() => setLocation('/')} /><main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-10 lg:px-16 lg:py-16"><div className="mb-12 flex flex-col justify-between gap-8 border-b border-[hsl(var(--border))] pb-8 sm:flex-row sm:items-end"><div><Link href="/" className="mb-6 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]" data-testid="link-back-store"><ArrowLeft size={14} /> Back to store</Link><p className="mono-label text-[hsl(var(--accent-foreground))]">Self-checkout / Terminal 3</p><h1 className="mt-3 text-5xl font-medium tracking-[-.06em] sm:text-7xl">Ready when<br /><span className="display-serif italic">you are.</span></h1></div><div className="flex items-center gap-2 sm:pb-2">{['Basket', 'Travel', 'Confirm'].map((label, index) => <div key={label} className="flex items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center text-[10px] font-bold ${step > index ? 'bg-[hsl(var(--secondary))]' : step === index + 1 ? 'bg-[hsl(var(--primary))] text-[hsl(var(--background))]' : 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}>{step > index ? <Check size={13} /> : index + 1}</span><span className={`hidden text-[10px] font-bold uppercase tracking-[0.14em] sm:inline ${step === index + 1 ? '' : 'text-[hsl(var(--muted-foreground))]'}`}>{label}</span>{index < 2 && <span className="mx-1 h-px w-5 bg-[hsl(var(--border))]" />}</div>)}</div></div>
      <div className="grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
        <div className="space-y-8">
          <section className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8" data-testid="section-travel-details"><div className="mb-7 flex items-start justify-between"><div><span className="mono-label text-[hsl(var(--accent-foreground))]">01 / Travel details</span><h2 className="mt-2 text-2xl font-bold tracking-[-.03em]">Tell us where you're going.</h2></div><ShieldCheck size={22} className="text-[hsl(var(--accent-foreground))]" /></div><div className="grid gap-5 sm:grid-cols-2"><label className="text-xs font-bold">Destination<select value={destination} onChange={(event) => setDestination(event.target.value)} className="mt-2 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="select-destination"><option>Japan</option><option>United States</option><option>United Kingdom</option><option>Singapore</option><option>Australia</option><option>France</option></select></label><label className="text-xs font-bold">Departure time<input value={flightTime} onChange={(event) => setFlightTime(event.target.value)} className="mt-2 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="input-flight-time" /></label><label className="text-xs font-bold sm:col-span-2">Flight number<input required value={flightNumber} onChange={(event) => setFlightNumber(event.target.value)} placeholder="e.g. NH 212" className="mt-2 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3.5 text-sm uppercase outline-none focus:border-[hsl(var(--primary))] placeholder:normal-case placeholder:text-[hsl(var(--muted-foreground))]" data-testid="input-flight-number" /></label></div>{quote && <div className={`mt-6 flex items-start gap-3 border px-4 py-3 text-xs leading-relaxed ${quote.eligible ? 'border-[hsl(var(--secondary))] bg-[hsl(var(--secondary)/.12)]' : 'border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.08)]'}`} data-testid="status-eligibility"><ShieldCheck size={16} className="mt-0.5 shrink-0" /><span>{quote.message}</span></div>}</section>
           <section className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8" data-testid="section-rfid-scan"><div className="mb-6 flex items-start justify-between"><div><span className="mono-label text-[hsl(var(--accent-foreground))]">02 / Item verification</span><h2 className="mt-2 text-2xl font-bold tracking-[-.03em]">Scan your tagged pieces.</h2><p className="mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">Place each item on the reader. We'll confirm it is in your basket before payment.</p></div><Radio size={25} className="text-[hsl(var(--accent-foreground))]" /></div><div className="relative overflow-hidden border border-dashed border-[hsl(var(--accent-foreground)/.6)] bg-[hsl(var(--muted)/.55)] p-5"><div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-[hsl(var(--accent-foreground))] scanline" /><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[hsl(var(--muted-foreground))]">{readerConnected ? <><span className="h-2 w-2 rounded-full bg-[hsl(var(--secondary-foreground))]" /> Reader connected</> : 'Manual entry or hardware reader'}</span><button type="button" onClick={connectReader} disabled={readerBusy} className="flex items-center gap-2 border border-[hsl(var(--primary))] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[hsl(var(--primary))] disabled:opacity-50" data-testid="button-connect-reader"><Radio size={13} /> {readerBusy ? 'Listening...' : 'Connect reader'}</button></div><form onSubmit={scan} className="flex flex-col gap-3 sm:flex-row"><div className="flex flex-1 items-center border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3"><ScanLine size={16} className="mr-2 text-[hsl(var(--muted-foreground))]" /><input value={tagId} onChange={(event) => setTagId(event.target.value)} placeholder="Enter RFID tag ID" className="w-full bg-transparent py-3.5 text-sm outline-none" data-testid="input-rfid-tag" /></div><button type="submit" disabled={scanMutation.isPending} className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--background))] disabled:opacity-60" data-testid="button-scan-rfid">{scanMutation.isPending ? 'Reading...' : <><ScanLine size={14} /> Scan item</>}</button></form>{scanMessage && <p className="mt-4 flex items-center gap-2 text-xs font-semibold" data-testid="status-rfid-result"><CheckCircle2 size={15} className={scannedTag ? 'text-[hsl(var(--secondary-foreground))]' : 'text-[hsl(var(--destructive))]'} /> {scanMessage}</p>}<p className="mt-4 flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]"><Info size={13} /> Try a tag from the item's packaging.</p></div></section>
          <section className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8" data-testid="section-payment"><div className="mb-6 flex items-start justify-between"><div><span className="mono-label text-[hsl(var(--accent-foreground))]">03 / Payment-ready confirmation</span><h2 className="mt-2 text-2xl font-bold tracking-[-.03em]">Where should we send your receipt?</h2></div><CreditCard size={23} className="text-[hsl(var(--accent-foreground))]" /></div><div className="space-y-5"><label className="block text-xs font-bold">Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3.5 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="input-email" /></label><div><p className="mb-2 text-xs font-bold">Payment method</p><div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setPaymentMethod('card')} className={`flex items-center justify-between border p-4 text-left text-xs font-bold ${paymentMethod === 'card' ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))]' : 'border-[hsl(var(--border))]'}`} data-testid="button-payment-card"><span className="flex items-center gap-2"><CreditCard size={16} /> Card at collection</span>{paymentMethod === 'card' && <Check size={15} />}</button><button type="button" onClick={() => setPaymentMethod('mobile-pay')} className={`flex items-center justify-between border p-4 text-left text-xs font-bold ${paymentMethod === 'mobile-pay' ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))]' : 'border-[hsl(var(--border))]'}`} data-testid="button-payment-mobile"><span className="flex items-center gap-2"><Radio size={16} /> Mobile pay</span>{paymentMethod === 'mobile-pay' && <Check size={15} />}</button></div></div></div></section>
          <button type="button" onClick={() => complete({ preventDefault: () => undefined } as FormEvent)} disabled={checkoutMutation.isPending || !quote?.eligible || !flightNumber || !email} className="flex w-full items-center justify-center gap-3 bg-[hsl(var(--primary))] py-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[hsl(var(--background))] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-complete-checkout">{checkoutMutation.isPending ? 'Preparing your collection...' : <>Confirm and reserve <ArrowRight size={16} /></>}</button>
          {checkoutMutation.isError && <p className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--destructive))]" data-testid="status-checkout-error"><CircleAlert size={15} /> We couldn't complete that just yet. Please check your details and try again.</p>}
        </div>
        <aside className="lg:sticky lg:top-5"><div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-7"><div className="mb-6 flex items-center justify-between"><h2 className="display-serif text-3xl italic">Your edit</h2><button onClick={onClear} className="text-[10px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] underline" data-testid="button-clear-basket">Clear</button></div><div className="space-y-4">{basket.map((line) => <div className="flex gap-3" key={line.product.id} data-testid={`checkout-line-${line.product.id}`}><div className="h-16 w-14 shrink-0"><ProductVisual product={line.product} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{line.product.name}</p><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Qty {line.quantity}</p><button onClick={() => onRemove(line.product.id)} className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] underline" data-testid={`button-checkout-remove-${line.product.id}`}>Remove</button></div><span className="text-xs font-bold">{money(line.product.price * line.quantity)}</span></div>)}</div><div className="my-6 border-t border-[hsl(var(--border))] pt-5 text-sm">{quoteMutation.isPending && <div className="mb-4 h-4 w-2/3 animate-pulse bg-[hsl(var(--muted))]" data-testid="skeleton-quote" />}{quoteMutation.isError && <p className="mb-4 flex items-center gap-2 text-xs text-[hsl(var(--destructive))]" data-testid="status-quote-error"><CircleAlert size={14} /> Quote unavailable. Check again in a moment.</p>}<div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>Subtotal</span><span>{quote ? money(quote.subtotal) : money(basket.reduce((sum, line) => sum + line.product.price * line.quantity, 0))}</span></div>{quote && <><div className="mt-2 flex justify-between text-[hsl(var(--accent-foreground))]"><span>Duty-free saving</span><span>-{money(quote.savings)}</span></div><div className="mt-2 flex justify-between text-[hsl(var(--muted-foreground))]"><span>Duties</span><span>{quote.duties ? money(quote.duties) : 'Included'}</span></div><div className="mt-5 flex justify-between border-t border-[hsl(var(--border))] pt-5 text-base font-extrabold"><span>Total</span><span data-testid="text-quote-total">{money(quote.total)}</span></div></>}</div><div className="flex items-start gap-2 border-t border-[hsl(var(--border))] pt-5 text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]"><Clock3 size={14} className="mt-0.5 shrink-0" /> Collect after security at the designated point before boarding.</div></div></aside>
      </div>
    </main></div>;
}

function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [order, setOrder] = useState<CheckoutResult | null>(null);
  useEffect(() => { try { setOrder(JSON.parse(localStorage.getItem('armani-last-order') ?? 'null') as CheckoutResult | null); } catch { setOrder(null); } }, []);
  const result = order?.orderId === id ? order : null;
  return <div className="armani-shell min-h-[100dvh]"><Header count={0} onBasket={() => setLocation('/')} /><main className="mx-auto max-w-4xl px-5 py-16 sm:px-10 lg:py-24"><div className="border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><div className="relative overflow-hidden bg-[hsl(var(--primary))] px-6 py-14 text-center text-[hsl(var(--background))] sm:px-12"><div className="absolute inset-0 opacity-20 quiet-grid" /><div className="relative"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Check size={30} /></div><p className="mono-label text-[hsl(var(--secondary))]">Collection reserved</p><h1 className="display-serif mt-4 text-5xl italic sm:text-7xl">You're all set.</h1><p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[hsl(var(--background)/.7)]">{result?.message ?? 'Your Armani beauty selection is ready to meet you before departure.'}</p></div></div><div className="grid gap-8 p-6 sm:p-10 md:grid-cols-2"><div><p className="mono-label text-[hsl(var(--muted-foreground))]">Reservation number</p><p className="mt-2 font-mono text-xl font-medium tracking-[0.08em]" data-testid="text-order-id">{id}</p><div className="mt-7 grid grid-cols-2 gap-6"><div><p className="mono-label text-[hsl(var(--muted-foreground))]">Total</p><p className="mt-2 text-lg font-extrabold" data-testid="text-order-total">{money(result?.total ?? 0)}</p></div><div><p className="mono-label text-[hsl(var(--muted-foreground))]">Window</p><p className="mt-2 text-sm font-bold" data-testid="text-collection-window">{result?.collectionWindow ?? 'Before your boarding call'}</p></div></div></div><div className="border-l-0 border-[hsl(var(--border))] md:border-l md:pl-8"><p className="mono-label text-[hsl(var(--muted-foreground))]">Collection instructions</p><div className="mt-4 flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><MapPinIcon /></span><p className="text-sm leading-6"><strong className="block">{result?.collectionPoint ?? 'Terminal 2 · Collection desk'}</strong>Present this reservation number and your boarding pass after security.</p></div><div className="mt-5 flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[hsl(var(--muted))]"><Clock3 size={15} /></span><p className="text-sm leading-6">Allow a little time before boarding. Your pieces will be waiting, wrapped and ready.</p></div></div></div><div className="flex flex-col gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/.45)] p-6 sm:flex-row sm:justify-between sm:px-10"><Link href="/" className="flex items-center justify-center gap-2 border border-[hsl(var(--primary))] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.15em]" data-testid="link-back-home">Back to collection</Link><button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[hsl(var(--background))]" data-testid="button-print-order">Print details <ArrowRight size={14} /></button></div></div></main></div>;
}

function MapPinIcon() {
  return <span className="relative block h-4 w-3 rounded-t-full border-2 border-[hsl(var(--primary))] after:absolute after:bottom-[-5px] after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rotate-45 after:border-b-2 after:border-r-2 after:border-[hsl(var(--primary))]" />;
}

function Router({ basket, onAdd, onAdjust, onRemove, onClear, onBasket }: { basket: BasketLine[]; onAdd: (product: Product) => void; onAdjust: (id: string, change: number) => void; onRemove: (id: string) => void; onClear: () => void; onBasket: () => void }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={() => <HomePage onAdd={onAdd} onBasket={onBasket} count={basket.reduce((sum, line) => sum + line.quantity, 0)} />} />
    <Route path="/checkout" component={() => <CheckoutPage basket={basket} onAdd={onAdd} onRemove={onRemove} onClear={onClear} />} />
    <Route path="/order/:id" component={OrderPage} />
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}

function App() {
  const cart = usePersistedBasket();
  const [basketOpen, setBasketOpen] = useState(false);
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router basket={cart.basket} onAdd={cart.add} onAdjust={cart.adjust} onRemove={cart.remove} onClear={cart.clear} onBasket={() => setBasketOpen(true)} /></WouterRouter><BasketDrawer basket={cart.basket} open={basketOpen} onClose={() => setBasketOpen(false)} onAdjust={cart.adjust} onRemove={cart.remove} /></QueryClientProvider>;
}

export default App;
