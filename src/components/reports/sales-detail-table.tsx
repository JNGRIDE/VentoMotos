import { useMemo } from "react"
import { format, isValid } from "date-fns"
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { Sale, UserProfile } from "@/lib/data"
import { EXTERNAL_SALESPERSON_ID } from "@/lib/constants"

interface SalesDetailTableProps {
  sales: Sale[];
  userProfiles: UserProfile[];
}

export function SalesDetailTable({ sales, userProfiles }: SalesDetailTableProps) {
  const userProfilesMap = useMemo(() => {
    return userProfiles.reduce((map, sp) => {
      map[sp.uid] = sp;
      return map;
    }, {} as Record<string, UserProfile>);
  }, [userProfiles]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isValid(d) ? format(d, "dd MMM", { locale: es }) : "N/A";
  };

  const getYear = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return isValid(d) ? d.getFullYear().toString() : "";
  };

  return (
    <Card className="border-none shadow-soft rounded-[32px] overflow-hidden group hover:shadow-premium transition-all duration-500 print:border-0 print:shadow-none print:rounded-none">
      <CardContent className="p-0 print:p-0">
        <Table className="print:text-xs">
          <TableHeader className="bg-secondary/30 print:bg-transparent">
            <TableRow className="border-none hover:bg-transparent print:border-b print:border-border">
              <TableHead className="w-[100px] h-14 pl-8 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Fecha</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Ejecutivo</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Cliente</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Modelo</TableHead>
              <TableHead className="h-14 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Método</TableHead>
              <TableHead className="h-14 pr-8 text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => {
              const isExternal = sale.salespersonId === EXTERNAL_SALESPERSON_ID;
              const userProfile = isExternal ? null : userProfilesMap[sale.salespersonId];
              const year = getYear(sale.date);
              
              return (
              <TableRow key={sale.id} className="h-20 border-border/40 hover:bg-secondary/20 transition-colors group/row print:h-auto print:py-2">
                <TableCell className="pl-8 print:pl-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground/90">{formatDate(sale.date)}</span>
                    {year && <span className="text-[10px] text-muted-foreground uppercase">{year}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                      <AvatarImage src={userProfile?.avatarUrl} />
                      <AvatarFallback className="text-[10px] font-bold">{isExternal ? 'E' : userProfile?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm truncate max-w-[120px]">
                      {isExternal ? 'Venta Externa' : (userProfile?.name?.split(' ')[0] || 'N/A')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-muted-foreground group-hover/row:text-foreground transition-colors">{sale.prospectName}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground border-none font-bold rounded-lg px-2 py-0.5">
                    {sale.motorcycleModel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`rounded-lg px-2.5 py-1 font-black text-[9px] uppercase tracking-tighter border-none shadow-none ${
                    sale.paymentMethod === 'Financing' 
                      ? 'bg-blue-500/10 text-blue-600' 
                      : 'bg-green-500/10 text-green-600'
                  }`}>
                    {sale.paymentMethod === 'Financing' ? 'Crédito' : 'Contado'}
                  </Badge>
                </TableCell>
                <TableCell className="pr-8 print:pr-2 text-right font-black text-base text-foreground/90 print:text-sm">
                  ${sale.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </TableCell>
              </TableRow>
            )})}
             {sales.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                          <SearchIcon className="h-6 w-6" />
                        </div>
                        <p className="font-bold uppercase tracking-widest text-xs">Sin registros en este periodo</p>
                      </div>
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
