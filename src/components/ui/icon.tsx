import { Icon as IconifyIcon } from '@iconify/react'
import remixIcons from '@iconify-json/ri/icons.json'

type Props = Omit<React.ComponentProps<typeof IconifyIcon>, 'icon'> & {
  name: string
}

export function Icon({ name, ...props }: Props) {
  const source = (remixIcons.icons as Record<string, { body: string }>)[name]
  const iconData = source
    ? { ...source, width: 24, height: 24 }
    : `ri:${name}`
  return <IconifyIcon icon={iconData} {...props} />
}
