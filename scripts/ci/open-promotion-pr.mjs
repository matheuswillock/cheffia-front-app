import { spawnSync } from "node:child_process"

const START = "<!-- cheffia-promotion:start -->"
const END = "<!-- cheffia-promotion:end -->"

export function promotionTarget(branch) {
  if (/^(feature|bugfix)\/.+/.test(branch)) return "develop"
  if (branch === "develop") return "release"
  if (branch === "release") return "main"
  return null
}

export function upsertManagedPromotionBody(body, block) {
  const start = body.indexOf(START)
  const end = body.indexOf(END)
  if (start >= 0 && end >= start) {
    return `${body.slice(0, start)}${block}${body.slice(end + END.length)}`.trim()
  }
  return `${body.trim()}\n\n${block}`.trim()
}

function runGh(args) {
  const result = spawnSync("gh", args, { encoding: "utf8", env: process.env })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "gh command failed")
  return result.stdout.trim()
}

function main() {
  const branch = process.env.HEAD_BRANCH ?? ""
  const target = process.env.TARGET_BRANCH ?? promotionTarget(branch)
  if (!target || target !== promotionTarget(branch)) {
    throw new Error(`Unsupported promotion source branch: ${branch}`)
  }
  const repository = process.env.GH_REPOSITORY
  const sha = process.env.COMMIT_SHA
  const owner = process.env.GITHUB_REPOSITORY_OWNER ?? repository?.split("/")[0]
  const head = owner ? `${owner}:${branch}` : branch
  const existing = runGh(["pr", "list", "--repo", repository, "--head", branch, "--base", target, "--state", "open", "--json", "number,body", "--jq", ".[0] // empty"])

  const block = `${START}\nAutomated promotion for commit ${sha}. CI checks passed on ${branch}.\n${END}`
  if (existing) {
    const pr = JSON.parse(existing)
    const body = upsertManagedPromotionBody(pr.body ?? "", block)
    if (body !== (pr.body ?? "")) {
      runGh(["pr", "edit", String(pr.number), "--repo", repository, "--body", body])
      console.log(`Updated managed promotion details on PR #${pr.number}.`)
    } else {
      console.log(`Promotion PR #${pr.number} already exists: ${branch} -> ${target}`)
    }
    return
  }

  try {
    runGh(["pr", "create", "--repo", repository, "--head", head || branch, "--base", target,
      "--title", `Promote ${branch} to ${target}`, "--body", upsertManagedPromotionBody("", block)])
  } catch (error) {
    if (String(error.message).includes("No commits between")) {
      console.log(`No promotion needed: ${branch} is already included in ${target}.`)
      return
    }
    throw error
  }
}

if (import.meta.main) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
