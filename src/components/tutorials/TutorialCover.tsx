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
      <span className="type-caption font-medium text-link-accent">
        交互教程 · {stepsCount} 步
      </span>
      <h1 className="type-page-title m-0 mt-3 max-w-[20ch]">{title}</h1>
      {description ? (
        <p className="type-intro mb-0 mt-5 max-w-[58ch] text-muted-foreground">
          {description}
        </p>
      ) : null}
    </header>
  )
}
