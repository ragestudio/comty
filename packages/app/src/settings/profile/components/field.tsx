import type { ReactNode } from "react"

import classNames from "clsx"

import styles from "./field.module.less"

interface ProfileFieldProps {
	label?: ReactNode
	icon?: ReactNode
	extra?: ReactNode
	className?: string
	children: ReactNode
}

export const ProfileField = ({
	label,
	icon,
	extra,
	className,
	children,
}: ProfileFieldProps) => {
	const hasHeader = label || icon || extra

	return (
		<div className={classNames(styles.field, className)}>
			{hasHeader && (
				<div className={styles.header}>
					{(label || icon) && (
						<span className={styles.label}>
							{icon}
							{label}
						</span>
					)}

					{extra}
				</div>
			)}

			{children}
		</div>
	)
}

interface ProfileSectionProps {
	title: ReactNode
	icon?: ReactNode
	children: ReactNode
}

export const ProfileSection = ({
	title,
	icon,
	children,
}: ProfileSectionProps) => {
	return (
		<div className={styles.field}>
			<h4>
				{icon}
				{title}
			</h4>

			{children}
		</div>
	)
}
