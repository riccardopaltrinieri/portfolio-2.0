import { GetObjectCommand, HeadObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const RESUME_KEY = "resume/portfolio-resume.pdf"

let cachedClient: S3Client | null = null

function getClient() {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error("R2 credentials are not set")
  }

  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  }

  return cachedClient
}

export async function readResume() {
  const client = getClient()
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: RESUME_KEY,
      }),
    )

    if (!response.Body) return null
    return {
      body: response.Body,
      contentType: response.ContentType ?? "application/pdf",
      filename: "resume.pdf",
    }
  } catch (error) {
    if (error instanceof NoSuchKey || (typeof error === "object" && error !== null && (error as { name?: string }).name === "NoSuchKey")) {
      return null
    }
    throw error
  }
}

export async function resumeExists() {
  const client = getClient()
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: RESUME_KEY,
      }),
    )
    return true
  } catch (error) {
    if (error instanceof NoSuchKey || (typeof error === "object" && error !== null && (error as { name?: string }).name === "NoSuchKey")) {
      return false
    }
    throw error
  }
}

export async function writeResume(input: { file: Buffer; contentType?: string; filename?: string }) {
  const client = getClient()
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: RESUME_KEY,
      Body: input.file,
      ContentType: input.contentType ?? "application/pdf",
      Metadata: input.filename ? { filename: input.filename } : undefined,
    }),
  )
}
