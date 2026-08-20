import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CATEGORIES, PROVIDERS } from '../data/data'

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1400&q=80',
    metier: 'Plomberie',
    titre: 'Un plombier qualifié chez vous en quelques clics',
  },
  {
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1400&q=80',
    metier: 'Électricité',
    titre: 'Des électriciens certifiés près de chez vous',
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80',
    metier: 'Couture',
    titre: 'Les meilleurs couturiers et stylistes du Gabon',
  },
  {
  url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1400&q=80',
  metier: 'Nettoyage',
  titre: 'Un intérieur propre et sain, sans effort',
},
  {
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1400&q=80',
    metier: 'Peinture',
    titre: 'Donnez une nouvelle vie à vos espaces',
  },
]

const TEMOIGNAGES = [
  {
    nom: 'Amara Koumba',
    role: 'Cliente · Libreville',
    texte: 'J\'ai trouvé un excellent plombier en moins de 5 minutes. Le devis était clair et le travail impeccable. Je recommande ProFixGabon à tout le monde !',
    stars: 5,
    avatar: '👩🏾',
  },
  {
    nom: 'Jean-Baptiste Ondo',
    role: 'Client · Port-Gentil',
    texte: 'Enfin une plateforme qui connecte vraiment les Gabonais avec des professionnels sérieux. La négociation du prix directement avec le prestataire, c\'est top !',
    stars: 5,
    avatar: '👨🏿',
  },
  {
    nom: 'Stéphanie Mba',
    role: 'Cliente · Libreville',
    texte: 'La couturière que j\'ai trouvée ici a réalisé ma robe de mariage à la perfection. Professionnelle, ponctuelle et talentueuse. Merci ProFixGabon !',
    stars: 5,
    avatar: '👩🏿',
  },
]

const POURQUOI = [
  {
    icon: '🛡️',
    titre: 'Prestataires vérifiés',
    desc: 'Chaque professionnel est vérifié et évalué par notre équipe avant d\'être publié sur la plateforme.',
    bg: '#E8F5EE',
  },
  {
    icon: '💬',
    titre: 'Prix négocié',
    desc: 'Pas de prix imposé. Vous discutez directement avec le prestataire et convenez du tarif ensemble.',
    bg: '#EEF0FD',
  },
  {
    icon: '📄',
    titre: 'Devis officiel',
    desc: 'Un devis signé est généré automatiquement pour chaque mission, pour votre sécurité et traçabilité.',
    bg: '#FDF3E3',
  },
  {
    icon: '⭐',
    titre: 'Avis transparents',
    desc: 'Les avis clients sont vérifiés et publiés sans filtre pour vous aider à faire le bon choix.',
    bg: '#FBE8F0',
  },
  {
    icon: '⚡',
    titre: 'Disponible 7j/7',
    desc: 'Trouvez un prestataire disponible rapidement, même en urgence, tous les jours de la semaine.',
    bg: '#E8F5EE',
  },
  {
    icon: '📍',
    titre: 'Partout au Gabon',
    desc: 'Libreville, Port-Gentil, Franceville — nous couvrons les principales villes du Gabon.',
    bg: '#FDF3E3',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [voirTout, setVoirTout] = useState(false)
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ paddingTop: '64px', fontFamily: 'sans-serif' }}>

      {/* ═══════════════ HERO CAROUSEL ═══════════════ */}
      <div style={{ position: 'relative', height: '580px', overflow: 'hidden' }}>
        {SLIDES.map((slide, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${slide.url})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === current ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)',
            }} />
          </div>
        ))}

        <div style={{
          position: 'relative', zIndex: 2, height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 24px',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '99px', padding: '6px 16px',
            fontSize: '12px', fontWeight: '600', color: '#fff',
            marginBottom: '20px',
          }}>
            📍 {SLIDES[current].metier} · Libreville, Gabon
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: '800',
            color: '#fff', lineHeight: '1.15',
            marginBottom: '20px', maxWidth: '700px',
          }}>
            {SLIDES[current].titre}
          </h1>

          <p style={{
            fontSize: '17px', color: 'rgba(255,255,255,0.8)',
            maxWidth: '500px', marginBottom: '36px', lineHeight: '1.6',
          }}>
            Trouvez un prestataire qualifié près de chez vous et convenez du prix directement.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => navigate('/services')} style={{
              padding: '14px 28px', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700',
              background: '#fff', color: '#0F4526',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>🔍 Trouver un prestataire</button>
           <button onClick={() => scrollToSection('comment-ca-marche')} style={{
  padding: '14px 28px', borderRadius: '12px',
  fontSize: '15px', fontWeight: '700',
  background: 'transparent', color: '#fff',
  border: '1.5px solid rgba(255,255,255,0.5)', cursor: 'pointer',
}}>ℹ️ Comment ça marche</button>
          </div>
        </div>

        {/* Points */}
        <div style={{
          position: 'absolute', bottom: '24px', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: '8px', zIndex: 3,
        }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? '24px' : '8px', height: '8px',
              borderRadius: '99px',
              background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Flèches */}
        {['‹', '›'].map((arrow, i) => (
          <button key={i} onClick={() => setCurrent(prev =>
            i === 0 ? (prev - 1 + SLIDES.length) % SLIDES.length : (prev + 1) % SLIDES.length
          )} style={{
            position: 'absolute', [i === 0 ? 'left' : 'right']: '16px',
            top: '50%', transform: 'translateY(-50%)', zIndex: 3,
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', fontSize: '20px', cursor: 'pointer',
          }}>{arrow}</button>
        ))}

        {/* Stats */}
        <div style={{
          position: 'absolute', bottom: '60px', right: '32px',
          zIndex: 3, display: 'flex', gap: '12px', flexWrap: 'wrap',
        }}>
          {[{ val: '500+', lbl: 'Prestataires' }, { val: '2 000+', lbl: 'Missions' }, { val: '4.8★', lbl: 'Note moyenne' }].map(s => (
            <div key={s.lbl} style={{
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px', padding: '10px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ BARRE DE RECHERCHE ═══════════════ */}
      <div style={{ maxWidth: '700px', margin: '-28px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: '#fff', borderRadius: '18px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          padding: '8px 8px 8px 20px',
          display: 'flex', alignItems: 'center', gap: '12px',
          border: '1px solid #E2EBE7',
        }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <input type="text" placeholder="Ex : plombier, couturière, électricien..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', fontFamily: 'inherit' }}
          />
          <button onClick={() => navigate('/services')} style={{
            padding: '12px 22px', borderRadius: '12px',
            background: '#1A6B3C', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: '700',
          }}>Rechercher</button>
        </div>
      </div>

      {/* ═══════════════ CATEGORIES ═══════════════ */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Nos catégories</h2>
          <button onClick={() => setVoirTout(!voirTout)} style={{
            fontSize: '14px', fontWeight: '600', color: '#1A6B3C',
            border: 'none', background: 'none', cursor: 'pointer',
          }}>{voirTout ? 'Réduire ↑' : 'Voir tout →'}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
          {(voirTout ? CATEGORIES : CATEGORIES.slice(0, 8)).map(c => (
            <div key={c.label} onClick={() => navigate('/services')} style={{
              background: '#fff', border: '1px solid #E2EBE7',
              borderRadius: '18px', padding: '20px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              cursor: 'pointer',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '12px',
                background: c.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '22px',
              }}>{c.icon}</div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#4A5E55', textAlign: 'center' }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ COMMENT ÇA MARCHE ═══════════════ */}
     <div id="comment-ca-marche" style={{ background: '#F0F7F3', marginTop: '80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>Comment ça marche ?</h2>
            <p style={{ fontSize: '16px', color: '#4A5E55', maxWidth: '500px', margin: '0 auto' }}>
              Trouver un professionnel n'a jamais été aussi simple
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {[
              { n: '01', icon: '🔍', titre: 'Cherchez', desc: 'Parcourez nos catégories et trouvez le type de service dont vous avez besoin.' },
              { n: '02', icon: '👤', titre: 'Choisissez', desc: 'Consultez les profils, les avis et les spécialités des prestataires disponibles.' },
              { n: '03', icon: '💬', titre: 'Négociez', desc: 'Contactez le prestataire et convenez du prix directement via la messagerie.' },
              { n: '04', icon: '📄', titre: 'Validez', desc: 'Un devis officiel est généré et signé avant le début de la mission.' },
            ].map(s => (
              <div key={s.n} style={{
                background: '#fff', borderRadius: '18px',
                padding: '28px 24px', border: '1px solid #E2EBE7',
                position: 'relative',
              }}>
                <div style={{
                  fontSize: '48px', fontWeight: '800',
                  color: '#E8F5EE', lineHeight: '1', marginBottom: '16px',
                }}>{s.n}</div>
                <div style={{
                  position: 'absolute', top: '24px', right: '24px',
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: '#E8F5EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px',
                }}>{s.icon}</div>
                <p style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{s.titre}</p>
                <p style={{ fontSize: '13px', color: '#4A5E55', lineHeight: '1.6' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ PRESTATAIRES POPULAIRES ═══════════════ */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Prestataires populaires</h2>
          <button onClick={() => navigate('/services')} style={{
            fontSize: '14px', fontWeight: '600', color: '#1A6B3C',
            border: 'none', background: 'none', cursor: 'pointer',
          }}>Voir tout →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {PROVIDERS.slice(0, 3).map(p => (
            <div key={p.id} onClick={() => navigate(`/profil/${p.id}`)} style={{
              background: '#fff', border: '1px solid #E2EBE7',
              borderRadius: '18px', overflow: 'hidden', cursor: 'pointer',
            }}>
              <div style={{
                height: '140px', background: p.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '52px',
              }}>{p.emoji}</div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700' }}>{p.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#C8922A' }}>⭐ {p.rating}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#4A5E55', marginBottom: '12px' }}>{p.role} · {p.exp} d'exp.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '600',
                    background: '#E8F5EE', color: '#0F4526',
                    border: '1px solid #B8DCC8',
                    padding: '4px 10px', borderRadius: '99px',
                  }}>📄 Devis sur demande</span>
                  <span style={{
                    fontSize: '11px', fontWeight: '600',
                    background: p.available ? '#E6F9EE' : '#FDECEA',
                    color: p.available ? '#1A6B3C' : '#D94F3D',
                    padding: '4px 10px', borderRadius: '99px',
                  }}>{p.available ? 'Disponible' : 'Occupé'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ POURQUOI NOUS CHOISIR ═══════════════ */}
      <div style={{ background: '#0F4526' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>
              Pourquoi choisir ProFixGabon ?
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.65)', maxWidth: '500px', margin: '0 auto' }}>
              La plateforme de confiance pour tous vos besoins au Gabon
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {POURQUOI.map(p => (
              <div key={p.titre} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '18px', padding: '24px',
                display: 'flex', gap: '16px', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: p.bg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                }}>{p.icon}</div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{p.titre}</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ TÉMOIGNAGES ═══════════════ */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>Ce que disent nos clients</h2>
          <p style={{ fontSize: '16px', color: '#4A5E55' }}>Des milliers de Gabonais nous font déjà confiance</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {TEMOIGNAGES.map(t => (
            <div key={t.nom} style={{
              background: '#fff', border: '1px solid #E2EBE7',
              borderRadius: '18px', padding: '28px',
            }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {Array(t.stars).fill('⭐').map((s, i) => <span key={i}>{s}</span>)}
              </div>
              <p style={{
                fontSize: '14px', color: '#4A5E55',
                lineHeight: '1.7', marginBottom: '20px',
                fontStyle: 'italic',
              }}>"{t.texte}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#E8F5EE', fontSize: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{t.avatar}</div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700' }}>{t.nom}</p>
                  <p style={{ fontSize: '12px', color: '#8FA99E' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #0F4526, #1A6B3C)',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>
          Prêt à trouver votre prestataire ?
        </h2>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '36px', maxWidth: '450px', margin: '0 auto 36px' }}>
          Des centaines de professionnels vérifiés vous attendent sur ProFixGabon.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/services')} style={{
            padding: '16px 32px', borderRadius: '12px',
            fontSize: '16px', fontWeight: '700',
            background: '#fff', color: '#0F4526',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>🔍 Trouver un prestataire</button>
          <button onClick={() => navigate('/devenir-prestataire')} style={{
  padding: '16px 32px', borderRadius: '12px',
  fontSize: '16px', fontWeight: '700',
  background: 'transparent', color: '#fff',
  border: '1.5px solid rgba(255,255,255,0.4)', cursor: 'pointer',
}}>📝 Devenir prestataire</button>
        </div>
      </div>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <div style={{ background: '#071F10', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>ProFixGabon</div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', maxWidth: '260px', lineHeight: '1.6' }}>
                La plateforme de mise en relation entre particuliers et prestataires de services au Gabon.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              {[
                { titre: 'Services', liens: ['Plomberie', 'Électricité', 'Couture', 'Nettoyage'] },
                { titre: 'Entreprise', liens: ['À propos', 'Comment ça marche', 'Devenir prestataire'] },
                { titre: 'Support', liens: ['Aide', 'Contact', 'Conditions d\'utilisation'] },
              ].map(col => (
                <div key={col.titre}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>{col.titre}</p>
                  {col.liens.map(l => (
                    <p key={l} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px', cursor: 'pointer' }}>{l}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>© 2026 ProFixGabon · Tous droits réservés · Libreville, Gabon</p>
          </div>
        </div>
      </div>

    </div>
  )
}