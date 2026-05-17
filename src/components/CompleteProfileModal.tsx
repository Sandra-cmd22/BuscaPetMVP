import { useState } from "react";
import type { ProfileLocationInput } from "@/types/profile";

const inputClassName =
  "h-[48px] rounded-[8px] border border-[#a9a7a7] px-4 outline-none focus:border-primary transition-colors text-black w-full font-body text-[14px]";

const labelClassName =
  "font-semibold text-[14px] font-display text-black";

const CEARA_CITIES = [
  "Abaiara",
  "Acarape",
  "Acaraú",
  "Acopiara",
  "Aiuaba",
  "Alcântaras",
  "Altaneira",
  "Alto Santo",
  "Amontada",
  "Antonina do Norte",
  "Apuiarés",
  "Aquiraz",
  "Aracati",
  "Aracoiaba",
  "Ararendá",
  "Araripe",
  "Aratuba",
  "Arneiroz",
  "Assaré",
  "Aurora",
  "Baixio",
  "Banabuiú",
  "Barbalha",
  "Barreira",
  "Barro",
  "Barroquinha",
  "Baturité",
  "Beberibe",
  "Bela Cruz",
  "Boa Viagem",
  "Brejo Santo",
  "Camocim",
  "Campos Sales",
  "Canindé",
  "Capistrano",
  "Caridade",
  "Cariré",
  "Caririaçu",
  "Cariús",
  "Carnaubal",
  "Cascavel",
  "Catarina",
  "Catunda",
  "Caucaia",
  "Cedro",
  "Chaval",
  "Choró",
  "Chorozinho",
  "Coreaú",
  "Crateús",
  "Crato",
  "Croatá",
  "Cruz",
  "Deputado Irapuan Pinheiro",
  "Ererê",
  "Eusébio",
  "Farias Brito",
  "Forquilha",
  "Fortaleza",
  "Fortim",
  "Frecheirinha",
  "General Sampaio",
  "Graça",
  "Granja",
  "Granjeiro",
  "Groaíras",
  "Guaiúba",
  "Guaraciaba do Norte",
  "Guaramiranga",
  "Hidrolândia",
  "Horizonte",
  "Ibaretama",
  "Ibiapina",
  "Ibicuitinga",
  "Icapuí",
  "Icó",
  "Iguatu",
  "Independência",
  "Ipaporanga",
  "Ipaumirim",
  "Ipu",
  "Ipueiras",
  "Iracema",
  "Irauçuba",
  "Itaiçaba",
  "Itaitinga",
  "Itapagé",
  "Itapipoca",
  "Itapiúna",
  "Itarema",
  "Itatira",
  "Jaguaretama",
  "Jaguaribara",
  "Jaguaribe",
  "Jaguaruana",
  "Jardim",
  "Jati",
  "Jijoca de Jericoacoara",
  "Juazeiro do Norte",
  "Jucás",
  "Lavras da Mangabeira",
  "Limoeiro do Norte",
  "Madalena",
  "Maracanaú",
  "Maranguape",
  "Marco",
  "Martinópole",
  "Massapê",
  "Mauriti",
  "Meruoca",
  "Milagres",
  "Milhã",
  "Miraíma",
  "Missão Velha",
  "Mombaça",
  "Monsenhor Tabosa",
  "Morada Nova",
  "Moraújo",
  "Morrinhos",
  "Mucambo",
  "Mulungu",
  "Nova Olinda",
  "Nova Russas",
  "Novo Oriente",
  "Ocara",
  "Orós",
  "Pacajus",
  "Pacatuba",
  "Pacoti",
  "Pacujá",
  "Palhano",
  "Palmácia",
  "Paracuru",
  "Paraipaba",
  "Parambu",
  "Paramoti",
  "Pedra Branca",
  "Penaforte",
  "Pentecoste",
  "Pereiro",
  "Pindoretama",
  "Piquet Carneiro",
  "Pires Ferreira",
  "Poranga",
  "Porteiras",
  "Potengi",
  "Potiretama",
  "Quiterianópolis",
  "Quixadá",
  "Quixelô",
  "Quixeramobim",
  "Quixeré",
  "Redenção",
  "Reriutaba",
  "Russas",
  "Saboeiro",
  "Salitre",
  "Santa Quitéria",
  "Santana do Acaraú",
  "Santana do Cariri",
  "São Benedito",
  "São Gonçalo do Amarante",
  "São João do Jaguaribe",
  "São Luís do Curu",
  "Senador Pompeu",
  "Senador Sá",
  "Sobral",
  "Solonópole",
  "Tabuleiro do Norte",
  "Tamboril",
  "Tarrafas",
  "Tauá",
  "Tejuçuoca",
  "Tianguá",
  "Trairi",
  "Tururu",
  "Ubajara",
  "Umari",
  "Umirim",
  "Uruburetama",
  "Uruoca",
  "Varjota",
  "Várzea Alegre",
  "Viçosa do Ceará",
];

interface CompleteProfileModalProps {
  open: boolean;
  onSubmit: (fields: ProfileLocationInput) => Promise<void>;
}

function validate(fields: ProfileLocationInput): string | null {
  const phone = fields.telefone.replace(/\D/g, "");
  if (phone.length < 10) return "Informe um telefone válido.";
  if (fields.cidade.trim().length < 2) return "Informe sua cidade.";
  if (fields.bairro.trim().length < 2) {
    return "Informe seu bairro ou comunidade.";
  }
  return null;
}

export function CompleteProfileModal({
  open,
  onSubmit,
}: CompleteProfileModalProps) {
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fields = { telefone, cidade, bairro };
    const validationError = validate(fields);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(fields);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar seu perfil. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-profile-title"
    >
      <div
        className="w-full max-w-md bg-white rounded-[16px] shadow-xl px-[18px] py-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="complete-profile-title"
          className="text-center font-extrabold text-[24px] font-display text-black mb-3"
        >
          Complete seu perfil
        </h2>
        <p className="text-center text-[#757575] font-semibold text-[14px] font-display leading-relaxed mb-8 px-2">
          Adicione sua localização para ajudarmos a encontrar pets próximos de
          você.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClassName} htmlFor="profile-phone">
              Telefone
            </label>
            <input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className={inputClassName}
              placeholder="(85) 9 9999-9999"
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClassName} htmlFor="profile-city">
              Cidade
            </label>
            <select
              id="profile-city"
              autoComplete="address-level2"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className={inputClassName}
              disabled={loading}
              required
            >
              <option value="" disabled>
                Selecione sua cidade
              </option>
              {CEARA_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClassName} htmlFor="profile-neighborhood">
              Bairro / comunidade
            </label>
            <input
              id="profile-neighborhood"
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className={inputClassName}
              placeholder="Seu bairro ou comunidade"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <p className="text-[13px] text-destructive font-semibold font-body text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] bg-primary text-white rounded-[8px] font-bold text-[16px] font-display mt-4 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
