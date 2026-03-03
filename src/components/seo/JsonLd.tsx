interface JsonLdProps {
  id?: string
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

const safeSerialize = (data: JsonLdProps['data']) =>
  JSON.stringify(data).replace(/</g, '\\u003c')

export function JsonLd({ id, data }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeSerialize(data) }}
    />
  )
}
