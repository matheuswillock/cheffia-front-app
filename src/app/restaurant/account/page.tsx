"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Clock3,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";
import {
  handleGetRestaurantById,
  handleGetRestaurantFinancialAccount,
  handleGetRestaurantFinancialDocuments,
  handleSyncRestaurantFinancialDocuments,
  handleUploadRestaurantFinancialDocument,
} from "@/business/restaurant/restaurantBusiness";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OutputGetRestaurantById } from "@/models/dtos/output/OutputGetRestaurantById";
import type { OutputRestaurantFinancialAccount } from "@/models/dtos/output/OutputRestaurantFinancialAccount";
import type {
  OutputRestaurantFinancialOnboardingDocument,
  OutputRestaurantFinancialOnboardingDocumentUpload,
} from "@/models/dtos/output/OutputRestaurantFinancialOnboardingDocument";
import { verifySessionClient } from "@/utils/supabase/client";

const formatStatus = (value: string): string =>
  value
    .split("_")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ");

const getStatusClasses = (value: string): string => {
  const normalized = value.toLowerCase();

  if (normalized.includes("approved") || normalized.includes("configured") || normalized.includes("uploaded")) {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  }

  if (normalized.includes("failed") || normalized.includes("rejected")) {
    return "bg-red-500/15 text-red-300 border border-red-500/30";
  }

  return "bg-amber-500/15 text-amber-200 border border-amber-500/30";
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "Ainda nao sincronizado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatFileSize = (value: number): string => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatRejectReasons = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

export default function AccountPage() {
  const [restaurant, setRestaurant] = useState<OutputGetRestaurantById | null>(null);
  const [financialAccount, setFinancialAccount] =
    useState<OutputRestaurantFinancialAccount | null>(null);
  const [documents, setDocuments] = useState<OutputRestaurantFinancialOnboardingDocument[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [fileInputKeys, setFileInputKeys] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [syncingDocuments, setSyncingDocuments] = useState(false);
  const [uploadingDocumentId, setUploadingDocumentId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documentsNotice, setDocumentsNotice] = useState<string | null>(null);

  const loadDocuments = async (restaurantId: string): Promise<void> => {
    try {
      const financialDocuments = await handleGetRestaurantFinancialDocuments(restaurantId);
      setDocuments(financialDocuments);
      setDocumentsError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os documentos financeiros.";
      setDocuments([]);
      setDocumentsError(message);
    }
  };

  const loadAccountView = async (): Promise<void> => {
    try {
      const user = await verifySessionClient();
      if (!user) {
        throw new Error("Sessao invalida.");
      }

      const restaurantData = await handleGetRestaurantById(user.id);
      const financialAccountData = await handleGetRestaurantFinancialAccount(restaurantData.id);

      setRestaurant(restaurantData);
      setFinancialAccount(financialAccountData);
      await loadDocuments(restaurantData.id);
      setPageError(null);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Nao foi possivel carregar a conta financeira.";
      setPageError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountView().then(() => undefined);
  }, []);

  const handleSyncDocuments = async (): Promise<void> => {
    if (!restaurant) return;

    try {
      setSyncingDocuments(true);
      setDocumentsNotice(null);
      setDocumentsError(null);

      const syncedDocuments = await handleSyncRestaurantFinancialDocuments(restaurant.id);
      const refreshedAccount = await handleGetRestaurantFinancialAccount(restaurant.id);

      setDocuments(syncedDocuments);
      setFinancialAccount(refreshedAccount);
      setDocumentsNotice("Documentos financeiros sincronizados com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel sincronizar os documentos financeiros.";
      setDocumentsError(message);
    } finally {
      setSyncingDocuments(false);
    }
  };

  const handleSelectFile = (documentId: string, file: File | null): void => {
    setSelectedFiles((current) => ({
      ...current,
      [documentId]: file,
    }));
  };

  const resetSelectedFile = (documentId: string): void => {
    setSelectedFiles((current) => ({
      ...current,
      [documentId]: null,
    }));
    setFileInputKeys((current) => ({
      ...current,
      [documentId]: (current[documentId] ?? 0) + 1,
    }));
  };

  const handleUpload = async (
    document: OutputRestaurantFinancialOnboardingDocument
  ): Promise<void> => {
    if (!restaurant) return;

    const file = selectedFiles[document.onboardingDocumentId];
    if (!file) {
      setDocumentsError("Selecione um arquivo antes de enviar o documento.");
      return;
    }

    try {
      setUploadingDocumentId(document.onboardingDocumentId);
      setDocumentsNotice(null);
      setDocumentsError(null);

      await handleUploadRestaurantFinancialDocument(
        restaurant.id,
        document.onboardingDocumentId,
        file
      );

      resetSelectedFile(document.onboardingDocumentId);
      await handleSyncDocuments();
      setDocumentsNotice("Documento salvo no Cheffia e enviado ao Asaas.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel enviar o documento.";
      setDocumentsError(message);
    } finally {
      setUploadingDocumentId(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-6 md:p-8">
        <Card className="border-none bg-card shadow-md rounded-xl">
          <CardContent className="p-8 text-sm text-muted-foreground">
            Carregando status financeiro do Asaas...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (pageError || !restaurant || !financialAccount) {
    return (
      <main className="mx-auto max-w-6xl p-6 md:p-8">
        <Card className="border-red-500/30 bg-red-500/10 shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-200">
              <AlertCircle className="h-5 w-5" />
              Conta financeira indisponivel
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-100/90">
            {pageError ?? "Nao foi possivel localizar a conta financeira deste restaurante."}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <section className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Financeiro Asaas
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground-default">
              {restaurant.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe o onboarding da subconta, os documentos pendentes e o envio auditado ao Asaas.
            </p>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
              financialAccount.onboardingStatus
            )}`}
          >
            {formatStatus(financialAccount.onboardingStatus)}
          </span>
        </div>
        {financialAccount.commercialInfoIsExpired ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            Os dados comerciais da subconta expiraram. Atualize a conta no fluxo do Asaas para voltar a operar sem restricoes.
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none bg-card shadow-md rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              Subconta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold text-foreground-default">
              {financialAccount.asaasAccountId ?? "Ainda nao criada"}
            </p>
            <p className="text-muted-foreground">
              Provider: {financialAccount.provider.toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-md rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4" />
              Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold text-foreground-default">
              {financialAccount.asaasWalletId ?? "Aguardando retorno do Asaas"}
            </p>
            <p className="text-muted-foreground">
              Chave da subconta armazenada:{" "}
              {financialAccount.hasEncryptedApiKey ? "sim" : "nao"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-md rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              Aprovacao geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                financialAccount.generalStatus
              )}`}
            >
              {formatStatus(financialAccount.generalStatus)}
            </span>
            <p className="text-muted-foreground">
              Documentacao: {formatStatus(financialAccount.documentationStatus)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-md rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock3 className="h-4 w-4" />
              Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                financialAccount.webhookStatus
              )}`}
            >
              {formatStatus(financialAccount.webhookStatus)}
            </span>
            <p className="text-muted-foreground">
              Tipo da conta: {formatStatus(financialAccount.accountType)}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="border-none bg-card shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Status operacional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Informacoes comerciais
              </p>
              <p className="mt-2 font-semibold">
                {formatStatus(financialAccount.commercialInfoStatus)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Conta bancaria
              </p>
              <p className="mt-2 font-semibold">
                {formatStatus(financialAccount.bankAccountStatus)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Ultima sincronizacao
              </p>
              <p className="mt-2 font-semibold">
                {formatDateTime(financialAccount.lastStatusSyncAt)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background-default/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Expiracao comercial
              </p>
              <p className="mt-2 font-semibold">
                {financialAccount.commercialInfoIsExpired
                  ? "Expirada"
                  : financialAccount.commercialInfoExpirationScheduledAt
                    ? formatDateTime(financialAccount.commercialInfoExpirationScheduledAt)
                    : "Sem alerta"}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background-default/40 p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Ultimo erro registrado
              </p>
              <p className="mt-2 font-semibold text-foreground-default">
                {financialAccount.lastError ?? "Nenhum erro registrado."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Pendencias para provisionamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {financialAccount.missingFields.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {financialAccount.missingFields.map((field) => (
                  <span
                    key={field}
                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
                  >
                    {field}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Nenhuma pendencia estrutural identificada no cadastro atual.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground-default">
              Documentos de onboarding
            </h2>
            <p className="text-sm text-muted-foreground">
              Para uploads diretos, o arquivo e salvo primeiro no Supabase para auditoria e depois enviado ao Asaas.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleSyncDocuments().then(() => undefined);
            }}
            disabled={syncingDocuments || !financialAccount.asaasAccountId}
            className="rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${syncingDocuments ? "animate-spin" : ""}`} />
            {syncingDocuments ? "Sincronizando..." : "Sincronizar documentos"}
          </Button>
        </div>

        {documentsNotice && (
          <Card className="border-emerald-500/30 bg-emerald-500/10 shadow-md rounded-xl">
            <CardContent className="p-4 text-sm text-emerald-200">{documentsNotice}</CardContent>
          </Card>
        )}

        {documentsError && (
          <Card className="border-red-500/30 bg-red-500/10 shadow-md rounded-xl">
            <CardContent className="p-4 text-sm text-red-100/90">{documentsError}</CardContent>
          </Card>
        )}

        {documents.length === 0 ? (
          <Card className="border-none bg-card shadow-md rounded-xl">
            <CardContent className="p-8 text-sm text-muted-foreground">
              Nenhum grupo de documento foi sincronizado ainda. Use o botao acima para consultar o Asaas.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {documents.map((document) => {
              const rejectReasons = formatRejectReasons(document.rejectReasons);
              const latestUpload: OutputRestaurantFinancialOnboardingDocumentUpload | null =
                document.uploads[0] ?? null;

              return (
                <Card
                  key={document.onboardingDocumentId}
                  className="border-none bg-card shadow-md rounded-xl"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FileText className="h-4 w-4" />
                          {document.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {document.description ?? "Sem descricao adicional enviada pelo Asaas."}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          document.status
                        )}`}
                      >
                        {formatStatus(document.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border/60 px-2 py-1">
                        Tipo: {formatStatus(document.type)}
                      </span>
                      <span className="rounded-full border border-border/60 px-2 py-1">
                        Ultima sync: {formatDateTime(document.lastSyncedAt)}
                      </span>
                      {document.responsibleName && (
                        <span className="rounded-full border border-border/60 px-2 py-1">
                          Responsavel: {document.responsibleName}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-sm">
                    {rejectReasons && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-100/90">
                        <p className="text-xs uppercase tracking-wide text-red-200">
                          Motivo de rejeicao
                        </p>
                        <p className="mt-2">{rejectReasons}</p>
                      </div>
                    )}

                    {document.onboardingUrl ? (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-sm text-amber-100/90">
                          Este grupo exige fluxo externo do Asaas. O envio via API nao e aceito para ele.
                        </p>
                        <Button asChild className="mt-3 rounded-xl">
                          <a
                            href={document.onboardingUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Abrir onboarding externo
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-xl border border-border/60 bg-background-default/40 p-4">
                        <p className="text-sm text-muted-foreground">
                          Upload direto habilitado. O arquivo sera salvo no Supabase e enviado ao Asaas pelo backend.
                        </p>
                        <Input
                          key={fileInputKeys[document.onboardingDocumentId] ?? 0}
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(event) => {
                            handleSelectFile(
                              document.onboardingDocumentId,
                              event.target.files?.[0] ?? null
                            );
                          }}
                        />
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <p className="text-xs text-muted-foreground">
                            {selectedFiles[document.onboardingDocumentId]
                              ? `Arquivo selecionado: ${selectedFiles[document.onboardingDocumentId]?.name}`
                              : "Selecione um arquivo para envio."}
                          </p>
                          <Button
                            type="button"
                            onClick={() => {
                              handleUpload(document).then(() => undefined);
                            }}
                            disabled={
                              uploadingDocumentId === document.onboardingDocumentId ||
                              !selectedFiles[document.onboardingDocumentId]
                            }
                            className="rounded-xl"
                          >
                            <Upload className="h-4 w-4" />
                            {uploadingDocumentId === document.onboardingDocumentId
                              ? "Enviando..."
                              : "Enviar documento"}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Historico de uploads auditados
                      </p>

                      {latestUpload ? (
                        <div className="space-y-2 rounded-xl border border-border/60 bg-background-default/40 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium text-foreground-default">
                              {latestUpload.fileName}
                            </p>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                latestUpload.status
                              )}`}
                            >
                              {formatStatus(latestUpload.status)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{latestUpload.contentType}</span>
                            <span>{formatFileSize(latestUpload.fileSizeBytes)}</span>
                            <span>Criado em {formatDateTime(latestUpload.createdAt)}</span>
                            {latestUpload.uploadedAt && (
                              <span>Enviado em {formatDateTime(latestUpload.uploadedAt)}</span>
                            )}
                          </div>
                          <p className="break-all text-xs text-muted-foreground">
                            Storage: {latestUpload.storageBucket}/{latestUpload.storagePath}
                          </p>
                          {latestUpload.errorMessage && (
                            <p className="text-xs text-red-300">{latestUpload.errorMessage}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nenhum arquivo auditado foi registrado para este grupo ainda.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
