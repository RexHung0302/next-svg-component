import { SVGProps } from 'react'
import { WebpackRequireContext } from './types/webpack'
import { IconName } from './types/iconNames'
import clsx from 'clsx'

function importAll(requireContext: WebpackRequireContext, prefix = '') {
  const icons: Record<string, React.ComponentType<SVGProps<SVGElement>>> = {}
  requireContext.keys().forEach((item: string) => {
    const iconName = prefix + item.replace('./', '').replace('.svg', '')
    icons[iconName] = requireContext(item).default
  })
  return icons
}

const svgIcons = importAll(
  (
    require as unknown as { context: (dir: string, useSubdirs: boolean, pattern: RegExp) => WebpackRequireContext }
  ).context('./svg', false, /\.svg$/)
)
const svgWithColorIcons = importAll(
  (
    require as unknown as { context: (dir: string, useSubdirs: boolean, pattern: RegExp) => WebpackRequireContext }
  ).context('./svg/withColor', false, /\.svg$/),
  'withColor/'
)
const Icons = { ...svgIcons, ...svgWithColorIcons }

/**
 * @description SvgIcon 元件的屬性
 * @param {string} name - 圖標名稱
 * @param {number} size - 圖標大小
 * @param {string} className - 圖標類名
 * @param {SVGProps<SVGElement>[]} childrenSVGProps - 子圖標屬性
 * @param {SVGProps<SVGElement>} props - 其他屬性
 */
export interface IconProps extends SVGProps<SVGElement> {
  name: IconName
  size?: number
  className?: string
  childrenSVGProps?: SVGProps<SVGElement>[]
}

const SvgIcon: React.FC<IconProps> = ({ name, size = 16, className = '', childrenSVGProps, ...props }) => {
  const IconComponent = Icons[name]
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  return (
    <IconComponent
      width={size}
      height={size}
      className={clsx('cursor-pointer', className)}
      {...(childrenSVGProps ? ({ childrenSVGProps } as unknown as Record<string, unknown>) : {})}
      {...props}
    />
  )
}

export default SvgIcon
