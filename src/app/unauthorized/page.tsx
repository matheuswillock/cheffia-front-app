import Link from "next/link";

//  Criar o design desta página
export default function UnauthorizedPage() {
  return (
    <main>
      <h1>401 - Unauthorized</h1>
      <p>
        Please <Link href="/sign-in">log in</Link> to access this page.
      </p>
    </main>
  )
}