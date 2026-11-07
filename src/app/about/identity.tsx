import { Icon } from '@/components/ui/icon'
import { siteContent } from '@/lib/site-content'
import styles from './profile.module.css'

const profileLinks = [
  {
    href: siteContent.contact.github,
    label: 'GitHub',
    icon: 'github-line',
  },
  {
    href: siteContent.contact.bilibili,
    label: '哔哩哔哩',
    icon: 'bilibili-line',
  },
  {
    href: siteContent.contact.juejin,
    label: '掘金',
    icon: 'quill-pen-line',
  },
].filter((link): link is { href: string; label: string; icon: string } =>
  Boolean(link.href),
)

export function AboutIdentity() {
  const { profile } = siteContent

  return (
    <header className={styles.identity}>
      <div className={styles.identityRow}>
        <div className={styles.identityText}>
          <h1>{siteContent.name}</h1>
          <p className={styles.facts}>
            <span>{profile.location}</span>
            {profile.roles.map((role) => (
              <span
                key={role}
                title={role === 'FDE' ? 'Forward Deployed Engineer' : undefined}
              >
                {role}
              </span>
            ))}
          </p>
          {siteContent.subtitle ? (
            <p className={styles.bio}>{siteContent.subtitle}</p>
          ) : null}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://github.com/minorcell.png"
          alt=""
          width={64}
          height={64}
          className={styles.avatar}
          decoding="async"
        />
      </div>
      <div className={styles.profileLinks}>
        {profileLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="me noopener noreferrer"
          >
            <Icon name={link.icon} aria-hidden="true" className="h-4 w-4" />
            {link.label}
          </a>
        ))}
        {siteContent.contact.email ? (
          <a href={`mailto:${siteContent.contact.email}`} rel="me">
            <Icon name="mail-line" aria-hidden="true" className="h-4 w-4" />
            邮件
          </a>
        ) : null}
      </div>
    </header>
  )
}
