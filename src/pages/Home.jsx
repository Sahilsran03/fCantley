import React,{useEffect,useMemo,useState}from"react";
import{Link}from"react-router-dom";
import ProductCard from"../components/ProductCard.jsx";
import SEO from"../components/SEO.jsx";
import{ProductGridSkeleton}from"../components/Skeleton.jsx";
import{useAuth}from"../context/AuthContext.jsx";
import{useWishlist}from"../context/WishlistContext.jsx";
import api from"../services/api.js";
import{getMediaUrl,getOptimizedImageUrl}from"../utils/media.js";
import"./Home.css";

const blank={items:[],loading:true,error:""};
export default function Home(){
 const{isAuthenticated}=useAuth(),{products:wishlist}=useWishlist();
 const[categories,setCategories]=useState(blank),[featured,setFeatured]=useState(blank),[trending,setTrending]=useState(blank),[faqs,setFaqs]=useState(blank),[recent,setRecent]=useState([]);
 useEffect(()=>{const controller=new AbortController(),load=(url,setter,key)=>api.get(url,{signal:controller.signal}).then(r=>setter({items:r.data[key]||[],loading:false,error:""})).catch(e=>{if(e.name!=="CanceledError")setter({items:[],loading:false,error:"Content is unavailable right now."})});
  load("/categories",setCategories,"categories");load("/products?featured=true&limit=6&sort=featured",setFeatured,"products");load("/products?limit=6&sort=most-viewed",setTrending,"products");load("/faqs",setFaqs,"faqs");return()=>controller.abort()},[]);
 useEffect(()=>{if(!isAuthenticated){setRecent([]);return}const controller=new AbortController();api.get("/recently-viewed",{signal:controller.signal}).then(r=>setRecent((r.data.products||[]).map(x=>x?.product||x).filter(Boolean))).catch(e=>{if(e.name!=="CanceledError")setRecent([])});return()=>controller.abort()},[isAuthenticated]);
 const hero=featured.items.filter(p=>getMediaUrl(p.images?.[0])).slice(0,3);
 const ratings=useMemo(()=>[...featured.items,...trending.items].filter((p,i,a)=>Number(p.ratingCount||0)>0&&a.findIndex(x=>x._id===p._id)===i).sort((a,b)=>Number(b.ratingAverage)-Number(a.ratingAverage)).slice(0,3),[featured.items,trending.items]);
 const personal=recent.length?recent:wishlist.slice(0,4),personalTitle=recent.length?"Recently viewed":"Saved for you",personalLink=recent.length?"/recently-viewed":"/wishlist";
 const Products=({label,title,feed,id})=>{if(!feed.loading&&!feed.error&&!feed.items.length)return null;return <section className="home-section home-products" aria-labelledby={id}><Heading label={label} title={title} id={id} link="/shop"/>{feed.loading&&<div className="home-loading" role="status"><span>Loading {label.toLowerCase()} products</span><ProductGridSkeleton count={4}/></div>}{feed.error&&<p className="home-state" role="status">{feed.error}</p>}{!feed.loading&&!feed.error&&<div className="home-product-grid">{feed.items.slice(0,4).map(p=><ProductCard key={p._id} product={p}/>)}</div>}</section>};
 const Heading=({label,title,id,link})=><div className="home-heading"><div><p>{label}</p><h2 id={id}>{title}</h2></div>{link&&<Link to={link}>View all</Link>}</div>;
 return <div className="cantley-home">
  <SEO title="Cantley Custom Apparel, Stickers, Labels and Design Studio" description="Shop Cantley clothing, stickers, labels, featured products, and custom design options." canonical="/"/>
  <section className={"editorial-hero "+(!hero.length?"is-typographic":"")} aria-labelledby="home-title">
   <div className="hero-media">{featured.loading&&<div className="hero-loading" role="status">Loading featured products</div>}{!featured.loading&&hero.length>0&&<><Link className="hero-primary" to={"/products/"+hero[0].slug}><img src={getOptimizedImageUrl(hero[0].images?.[0],{width:1000})} alt={hero[0].name} loading="eager" fetchPriority="high" width="1000" height="1250"/><span>{hero[0].name}</span></Link>{hero.slice(1).map(p=><Link className="hero-support" to={"/products/"+p.slug} key={p._id}><img src={getOptimizedImageUrl(p.images?.[0],{width:480})} alt={p.name} loading="eager" width="480" height="600"/></Link>)}</>}</div>
   <div className="hero-copy"><p className="home-kicker">Cantley / Made to be worn</p><h1 id="home-title">Everyday pieces. Your own point of view.</h1><p>Discover Cantley apparel, labels, and product drops, or make the next piece your own.</p><div className="hero-ctas"><Link className="home-primary" to="/shop">Shop now</Link><Link className="home-text-link" to="/design-studio">Design your own</Link></div></div>
  </section>
  {(categories.loading||categories.error||categories.items.length>0)&&<section className="home-section home-categories" aria-labelledby="category-title"><Heading label="Explore Cantley" title="Shop by category" id="category-title" link={!categories.error?"/shop":null}/>{categories.loading&&<div className="category-grid-home category-loading" role="status"><span>Loading categories</span>{[1,2,3,4].map(x=><i key={x}/>)}</div>}{categories.error&&<p className="home-state" role="status">{categories.error}</p>}{!categories.loading&&!categories.error&&<div className="category-grid-home">{categories.items.slice(0,6).map(c=><Link className="category-tile-home" to={"/shop?category="+c.slug} key={c._id}><img src={getOptimizedImageUrl(c.image,{width:560})||"https://placehold.co/560x700/f1f0ec/333?text=Cantley"} alt={c.name} loading="lazy" width="560" height="700"/><span>{c.name}</span></Link>)}</div>}</section>}
  <Products label="Featured" title="The Cantley edit" feed={featured} id="featured-title"/>
  <section className="home-section studio-editorial" aria-labelledby="studio-title"><div className="studio-mark" aria-hidden="true">C / STUDIO</div><div><p className="home-kicker">Make it personal</p><h2 id="studio-title">Start with an idea. Make it yours.</h2><p>Use Cantley Design Studio to add your artwork and preview a custom product before ordering.</p><Link className="home-light" to="/design-studio">Open Design Studio</Link></div></section>
  <Products label="Trending" title="On the radar" feed={trending} id="trending-title"/>
  <section className="home-section service-strip" aria-label="Shopping with Cantley">{[["01","Shop products","Browse current categories and products."],["02","Secure checkout","Complete payment through the existing checkout."],["03","Order tracking","Follow an order using Cantley tracking."],["04","Design Studio","Prepare a custom product from your artwork."]].map(x=><div key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><p>{x[2]}</p></div>)}</section>
  <section className="home-section bulk-editorial" aria-labelledby="bulk-title"><div><p className="home-kicker">For teams, events and brands</p><h2 id="bulk-title">Need more than one?</h2></div><p>Share your quantities, artwork, and requirements with Cantley for a bulk-order quote.</p><Link className="home-outline" to="/bulk-orders">Request a quote</Link></section>
  {ratings.length>0&&<section className="home-section home-ratings" aria-labelledby="ratings-title"><Heading label="Customer ratings" title="Top rated by customers" id="ratings-title"/><div className="rating-grid-home">{ratings.map(p=><Link to={"/products/"+p.slug} key={p._id}><strong>{Number(p.ratingAverage||0).toFixed(1)} <span>/ 5</span></strong><p>{p.name}</p><small>{p.ratingCount} {p.ratingCount===1?"rating":"ratings"}</small></Link>)}</div></section>}
  {!faqs.loading&&!faqs.error&&faqs.items.length>0&&<section className="home-section home-faq" aria-labelledby="faq-title"><Heading label="Questions" title="Good to know" id="faq-title" link="/faq"/><div className="faq-grid-home">{faqs.items.slice(0,3).map(f=><article key={f._id||f.title}><h3>{f.title}</h3><p>{String(f.content||"").replace(/<[^>]*>/g,"").slice(0,170)}</p></article>)}</div></section>}
  {isAuthenticated&&personal.length>0&&<section className="home-section home-personal" aria-labelledby="personal-title"><Heading label="Just for you" title={personalTitle} id="personal-title" link={personalLink}/><div className="home-product-grid">{personal.slice(0,4).map(p=><ProductCard key={p._id} product={p}/>)}</div></section>}
 </div>
}
