interface TutorialCoverProps {
  title: string
  description?: string
  stepsCount: number
}

export function TutorialCover({
  title,
  description,
  stepsCount,
}: TutorialCoverProps) {
  return (
    <header className="mx-auto w-full max-w-[1280px] px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10">
      <span className="text-[13px] font-medium text-[color:var(--link-accent)]">
        交互教程 · {stepsCount} 步
      </span>
      <h1 className="m-0 mt-3 max-w-[20ch] text-[2.5rem] font-semibold leading-[1.12] sm:text-[3.5rem]">
        {title}
      </h1>
      {description ? (
        <p className="mb-0 mt-5 max-w-[58ch] text-[1.0625rem] leading-7 text-muted-foreground sm:text-[1.125rem]">
          {description}
        </p>
      ) : null}
    </header>
  )
}
