import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ParamLocation = "path" | "query" | "header";
type TenantMode = "optional" | "required" | "none";

interface ApiParameter {
  name: string;
  in: ParamLocation;
  required: boolean;
  description?: string;
  example?: string;
}

interface ApiRequestBody {
  contentType: "application/json" | "multipart/form-data";
  example?: Record<string, unknown>;
  formDataFields?: Array<{ key: string; type: "text" | "file"; value?: string }>;
}

interface ApiRoute {
  method: HttpMethod;
  path: string;
  tag: "Restaurant" | "Menu" | "MenuLive" | "OrderHub" | "Payment" | "Auth";
  summary: string;
  tenant: TenantMode;
  idempotency?: boolean;
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  textResponse?: boolean;
}

const UUID = "00000000-0000-0000-0000-000000000000";

const routes: ApiRoute[] = [
  {
    method: "POST",
    path: "/api/v1/auth/forgot-password",
    tag: "Auth",
    summary: "Solicitar redefinicao de senha",
    tenant: "none",
    requestBody: {
      contentType: "application/json",
      example: {
        email: "contato@restaurante.com",
        nextPath: "/set-password",
      },
    },
  },
  {
    method: "POST",
    path: "/api/v1/auth/resend-confirmation",
    tag: "Auth",
    summary: "Reenviar confirmacao de email",
    tenant: "none",
    requestBody: {
      contentType: "application/json",
      example: {
        email: "contato@restaurante.com",
        nextPath: "/register/restaurant",
      },
    },
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/Restaurant/register",
    tag: "Restaurant",
    summary: "Registrar restaurante",
    tenant: "optional",
    idempotency: true,
    requestBody: {
      contentType: "application/json",
      example: {
        name: "Restaurante Exemplo",
        address: "Rua das Flores",
        addressNumber: "123",
        complement: "Sala 4",
        province: "Centro",
        postalCode: "01310100",
        phoneNumber: "11999999999",
        email: "contato@restaurante.com",
        emailVerified: false,
        supabaseId: UUID,
        ownerFullName: "Maria Silva",
        document: "12345678901",
        birthDate: "1990-05-16",
        providerAvatarUrl: "",
      },
    },
  },
  {
    method: "GET",
    path: "/api/v1/cheffia/Restaurant/{restaurantId}/financial-account",
    tag: "Restaurant",
    summary: "Consultar status financeiro Asaas do restaurante",
    tenant: "required",
    parameters: [{ name: "restaurantId", in: "path", required: true, example: UUID }],
  },
  {
    method: "GET",
    path: "/api/v1/cheffia/Restaurant/{restaurantId}/financial-account/summary",
    tag: "Restaurant",
    summary: "Consultar resumo financeiro Asaas do restaurante",
    tenant: "required",
    parameters: [{ name: "restaurantId", in: "path", required: true, example: UUID }],
  },
  {
    method: "GET",
    path: "/api/v1/cheffia/Restaurant/{restaurantId}/financial-account/documents",
    tag: "Restaurant",
    summary: "Listar documentos financeiros sincronizados do restaurante",
    tenant: "required",
    parameters: [{ name: "restaurantId", in: "path", required: true, example: UUID }],
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/Restaurant/{restaurantId}/financial-account/documents/sync",
    tag: "Restaurant",
    summary: "Sincronizar documentos financeiros no Asaas",
    tenant: "required",
    idempotency: true,
    parameters: [{ name: "restaurantId", in: "path", required: true, example: UUID }],
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/Restaurant/{restaurantId}/financial-account/documents/{documentId}/upload",
    tag: "Restaurant",
    summary: "Enviar documento financeiro do restaurante",
    tenant: "required",
    idempotency: true,
    parameters: [
      { name: "restaurantId", in: "path", required: true, example: UUID },
      { name: "documentId", in: "path", required: true, example: UUID },
    ],
    requestBody: {
      contentType: "multipart/form-data",
      formDataFields: [{ key: "documentFile", type: "file" }],
    },
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/Restaurant/{restaurantId}/financial-account/provision",
    tag: "Restaurant",
    summary: "Provisionar subconta Asaas do restaurante",
    tenant: "required",
    idempotency: true,
    parameters: [{ name: "restaurantId", in: "path", required: true, example: UUID }],
  },
  {
    method: "GET",
    path: "/api/v1/cheffia/Restaurant/{supabaseId}",
    tag: "Restaurant",
    summary: "Buscar restaurante por supabaseId",
    tenant: "optional",
    parameters: [{ name: "supabaseId", in: "path", required: true, example: UUID }],
  },
  {
    method: "GET",
    path: "/api/v1/cheffia/Restaurant/confirm-email",
    tag: "Restaurant",
    summary: "Confirmar e-mail de restaurante",
    tenant: "optional",
    textResponse: true,
    parameters: [{ name: "token", in: "query", required: true, example: "12345" }],
  },
  {
    method: "DELETE",
    path: "/api/v1/cheffia/Restaurant/{restaurantId}/delete",
    tag: "Restaurant",
    summary: "Excluir restaurante",
    tenant: "optional",
    idempotency: true,
    parameters: [{ name: "restaurantId", in: "path", required: true, example: UUID }],
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/Menu/items/add",
    tag: "Menu",
    summary: "Adicionar item ao menu (multipart)",
    tenant: "optional",
    idempotency: true,
    requestBody: {
      contentType: "multipart/form-data",
      formDataFields: [
        { key: "RestaurantId", type: "text", value: UUID },
        { key: "Item.Name", type: "text", value: "Pizza Margherita" },
        { key: "Item.Description", type: "text", value: "Massa fina e tomate fresco" },
        { key: "Item.Price", type: "text", value: "39.9" },
        { key: "Item.Ingredients", type: "text", value: "queijo, tomate, manjericao" },
        { key: "Item.CategoryId", type: "text", value: UUID },
        { key: "Item.ItemMedia", type: "file" },
      ],
    },
  },
  {
    method: "DELETE",
    path: "/api/v1/cheffia/Menu/items/delete",
    tag: "Menu",
    summary: "Excluir item do menu (query legado)",
    tenant: "optional",
    idempotency: true,
    parameters: [{ name: "itemId", in: "query", required: true, example: UUID }],
  },
  {
    method: "DELETE",
    path: "/api/v1/cheffia/Menu/items/delete/{itemId}",
    tag: "Menu",
    summary: "Excluir item do menu (path param)",
    tenant: "optional",
    idempotency: true,
    parameters: [{ name: "itemId", in: "path", required: true, example: UUID }],
  },
  {
    method: "GET",
    path: "/api/v1/cheffia/Menu/get",
    tag: "Menu",
    summary: "Buscar menu por restaurante",
    tenant: "optional",
    parameters: [{ name: "restaurantId", in: "query", required: true, example: UUID }],
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/Menu/get",
    tag: "Menu",
    summary: "Buscar menu por restaurante (contrato legado POST)",
    tenant: "optional",
    requestBody: {
      contentType: "application/json",
      example: { params: { restaurantId: UUID } },
    },
  },
  {
    method: "GET",
    path: "/api/v1/cheffia/MenuLive",
    tag: "MenuLive",
    summary: "Buscar MenuLive por restaurante",
    tenant: "optional",
    parameters: [
      { name: "restaurantId", in: "query", required: true, example: UUID },
      { name: "table", in: "query", required: false, example: "12" },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/OrderHub/send",
    tag: "OrderHub",
    summary: "Enviar pedido",
    tenant: "optional",
    idempotency: true,
    requestBody: {
      contentType: "application/json",
      example: {
        customerOrderId: null,
        restaurantId: UUID,
        tableNumber: "12",
        orderItems: [{ menuItemId: UUID, quantity: 2, comments: "sem cebola", tableNumber: "12" }],
      },
    },
  },
  {
    method: "GET",
    path: "/api/v1/cheffia/OrderHub/order",
    tag: "OrderHub",
    summary: "Buscar pedido por restaurantId + customerOrderId",
    tenant: "optional",
    parameters: [
      { name: "restaurantId", in: "query", required: true, example: UUID },
      { name: "customerOrderId", in: "query", required: true, example: UUID },
    ],
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/OrderHub/payment",
    tag: "OrderHub",
    summary: "Criar cobranca PIX para pedido",
    tenant: "optional",
    idempotency: true,
    requestBody: {
      contentType: "application/json",
      example: { customerOrderId: UUID, payTip: false, payer: { name: "Cliente PIX", phoneNumber: "11999999999", email: "cliente@cheffia.com", document: "12345678901" } },
    },
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/OrderHub/payment/confirmation",
    tag: "OrderHub",
    summary: "Confirmar status de pagamento PIX",
    tenant: "optional",
    idempotency: true,
    requestBody: {
      contentType: "application/json",
      example: { paymentPixId: "pay_1234567890" },
    },
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/OrderHub/webhook/asaas",
    tag: "OrderHub",
    summary: "Receber webhook Asaas",
    tenant: "required",
    parameters: [{ name: "asaas-access-token", in: "header", required: true, example: "replace_me" }],
    requestBody: {
      contentType: "application/json",
      example: { event: "PAYMENT_RECEIVED", payment: { id: "pay_1234567890", status: "RECEIVED" } },
    },
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/Payment/intent/create",
    tag: "Payment",
    summary: "Criar cobrança PIX compatível com o legado Payment/intent/create",
    tenant: "optional",
    idempotency: true,
    requestBody: {
      contentType: "application/json",
      example: { customerOrderId: UUID, payTip: false, payer: { name: "Cliente PIX", phoneNumber: "11999999999", email: "cliente@cheffia.com", document: "12345678901" } },
    },
  },
  {
    method: "POST",
    path: "/api/v1/cheffia/Payment/product/create",
    tag: "Payment",
    summary: "Endpoint legado descontinuado após remoção do Stripe",
    tenant: "optional",
    idempotency: true,
    requestBody: {
      contentType: "application/json",
      example: {},
    },
  },
];

const outputEnvelopeSchema = {
  type: "object",
  required: ["isValid", "successMessages", "errorMessages", "result"],
  properties: {
    isValid: { type: "boolean" },
    successMessages: { type: "array", items: { type: "string" } },
    errorMessages: { type: "array", items: { type: "string" } },
    result: { nullable: true },
  },
};

const variableValue = (name: string): string => {
  if (name === "x-tenant-id") return "{{tenantId}}";
  if (name === "idempotency-key") return "{{idempotencyKey}}";
  if (name === "asaas-access-token") return "{{asaasWebhookToken}}";
  return `{{${name.replace(/[^a-zA-Z0-9]+/g, "")}}}`;
};

const routeToOpenApiOperation = (route: ApiRoute): Record<string, unknown> => {
  const parameters: Array<Record<string, unknown>> = [...(route.parameters ?? [])].map((param) => ({
    name: param.name,
    in: param.in,
    required: param.required,
    description: param.description,
    schema: { type: "string" },
    example: param.example,
  }));

  if (route.tenant !== "none") {
    parameters.push({
      name: "x-tenant-id",
      in: "header",
      required: route.tenant === "required",
      description: "Tenant context (opcional quando resolvido por restaurantId/supabaseId).",
      schema: { type: "string", format: "uuid" },
      example: UUID,
    });
  }

  if (route.idempotency) {
    parameters.push({
      name: "idempotency-key",
      in: "header",
      required: false,
      description: "Reutilize a mesma chave em retries do mesmo payload.",
      schema: { type: "string" },
      example: "idem-example-001",
    });
  }

  const requestBody = route.requestBody
    ? route.requestBody.contentType === "application/json"
      ? {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
              example: route.requestBody.example ?? {},
            },
          },
        }
      : {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: Object.fromEntries(
                  (route.requestBody.formDataFields ?? []).map((field) => [
                    field.key,
                    field.type === "file" ? { type: "string", format: "binary" } : { type: "string" },
                  ])
                ),
              },
            },
          },
        }
    : undefined;

  const responses = route.textResponse
    ? {
        "200": { description: "OK", content: { "text/plain": { example: "Email confirmed successfully" } } },
        "400": { description: "Bad Request", content: { "text/plain": { example: "" } } },
        "500": { description: "Internal Error", content: { "text/plain": { example: "Internal error" } } },
      }
    : {
        "200": { description: "OK", content: { "application/json": { schema: outputEnvelopeSchema } } },
        "400": { description: "Bad Request", content: { "application/json": { schema: outputEnvelopeSchema } } },
        "500": { description: "Internal Error", content: { "application/json": { schema: outputEnvelopeSchema } } },
      };

  return {
    tags: [route.tag],
    summary: route.summary,
    operationId: `${route.tag.toLowerCase()}${route.summary.replace(/[^a-zA-Z0-9]+/g, "")}`,
    parameters,
    ...(requestBody ? { requestBody } : {}),
    responses,
  };
};

const buildOpenApi = (): Record<string, unknown> => {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const route of routes) {
    if (!paths[route.path]) paths[route.path] = {};
    paths[route.path][route.method.toLowerCase()] = routeToOpenApiOperation(route);
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Cheffia API v1 (Migration)",
      version: "1.0.0-migration",
      description: "Gerado a partir das rotas reais em src/app/api/v1/**.",
    },
    servers: [{ url: "http://localhost:3000", description: "Local" }],
    paths,
  };
};

const buildPostman = (): Record<string, unknown> => {
  const grouped = new Map<string, Array<Record<string, unknown>>>();

  for (const route of routes) {
    if (!grouped.has(route.tag)) grouped.set(route.tag, []);
    const urlPath = route.path.replace(/\{([^}]+)\}/g, ":$1");
    const query = (route.parameters ?? [])
      .filter((param) => param.in === "query")
      .map((param) => ({ key: param.name, value: param.example ?? variableValue(param.name), disabled: !param.required }));
    const headers = (route.parameters ?? [])
      .filter((param) => param.in === "header")
      .map((param) => ({ key: param.name, value: param.example ?? variableValue(param.name), disabled: !param.required }));

    if (route.tenant !== "none") {
      headers.push({ key: "x-tenant-id", value: "{{tenantId}}", disabled: route.tenant !== "required" });
    }
    if (route.idempotency) headers.push({ key: "idempotency-key", value: "{{idempotencyKey}}", disabled: false });
    if (route.requestBody?.contentType === "application/json") headers.push({ key: "Content-Type", value: "application/json", disabled: false });

    const requestBody =
      route.requestBody?.contentType === "application/json"
        ? { mode: "raw", raw: JSON.stringify(route.requestBody.example ?? {}, null, 2), options: { raw: { language: "json" } } }
        : route.requestBody?.contentType === "multipart/form-data"
        ? {
            mode: "formdata",
            formdata: (route.requestBody.formDataFields ?? []).map((field) =>
              field.type === "file" ? { key: field.key, type: "file", src: "" } : { key: field.key, type: "text", value: field.value ?? "" }
            ),
          }
        : undefined;

    grouped.get(route.tag)?.push({
      name: route.summary,
      request: {
        method: route.method,
        header: headers,
        url: {
          raw: `{{baseUrl}}${urlPath}`,
          host: ["{{baseUrl}}"],
          path: urlPath.replace(/^\//, "").split("/"),
          query,
        },
        ...(requestBody ? { body: requestBody } : {}),
      },
    });
  }

  return {
    info: {
      _postman_id: randomUUID(),
      name: "Cheffia API v1 (Migration)",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    variable: [
      { key: "baseUrl", value: "http://localhost:3000" },
      { key: "tenantId", value: UUID },
      { key: "idempotencyKey", value: "idem-example-001" },
      { key: "asaasWebhookToken", value: "replace_me" },
    ],
    item: Array.from(grouped.entries()).map(([name, item]) => ({ name, item })),
  };
};

const postmanEnvironment = {
  id: randomUUID(),
  name: "Cheffia Local",
  values: [
    { key: "baseUrl", value: "http://localhost:3000", enabled: true },
    { key: "tenantId", value: UUID, enabled: true },
    { key: "idempotencyKey", value: "idem-example-001", enabled: true },
    { key: "asaasWebhookToken", value: "replace_me", enabled: true },
  ],
  _postman_variable_scope: "environment",
  _postman_exported_at: new Date().toISOString(),
  _postman_exported_using: "cheffia-migration-task-14",
};

const writeJson = async (target: string, value: unknown): Promise<void> => {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const main = async (): Promise<void> => {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(scriptDir, "..");
  const openApi = buildOpenApi();

  const openApiFile = path.join(root, "src", "server", "openapi", "openapi.json");
  const postmanCollectionFile = path.join(root, "postman", "cheffia-v1.postman_collection.json");
  const postmanEnvFile = path.join(root, "postman", "cheffia-v1.environment.json");
  const insomniaImportFile = path.join(root, "insomnia", "cheffia-v1.openapi.json");

  await writeJson(openApiFile, openApi);
  await writeJson(postmanCollectionFile, buildPostman());
  await writeJson(postmanEnvFile, postmanEnvironment);
  await writeJson(insomniaImportFile, openApi);

  console.log(`[openapi] ${path.relative(root, openApiFile)}`);
  console.log(`[postman] ${path.relative(root, postmanCollectionFile)}`);
  console.log(`[postman] ${path.relative(root, postmanEnvFile)}`);
  console.log(`[insomnia] ${path.relative(root, insomniaImportFile)}`);
};

void main();

