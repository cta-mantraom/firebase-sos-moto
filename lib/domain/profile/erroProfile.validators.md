[{
	"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/lib/domain/profile/profile.validators.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'partial' does not exist on type 'ZodEffects<ZodObject<{ name: ZodString; surname: ZodString; birthDate: ZodString; email: ZodString; } & { cpf: ZodEffects<ZodString, string, string>; phone: ZodEffects<...>; address: ZodObject<...>; }, \"strip\", ZodTypeAny, { ...; }, { ...; }>, { ...; }, { ...; }>'.",
	"source": "ts",
	"startLineNumber": 131,
	"startColumn": 44,
	"endLineNumber": 131,
	"endColumn": 51,
	"extensionID": "vscode.typescript-language-features"
}]
[{
	"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/lib/domain/profile/profile.validators.ts",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'partial' does not exist on type 'ZodEffects<ZodObject<{ bloodType: ZodNativeEnum<typeof BloodType>; organDonor: ZodDefault<ZodBoolean>; } & { allergies: ZodDefault<ZodArray<ZodString, \"many\">>; medications: ZodDefault<...>; medicalConditions: ZodDefault<...>; emergencyNotes: ZodOptional<...>; }, \"strip\", ZodTypeAny, { ...; }, { ...; }>, { ...; }, {...'.",
	"source": "ts",
	"startLineNumber": 132,
	"startColumn": 42,
	"endLineNumber": 132,
	"endColumn": 49,
	"extensionID": "vscode.typescript-language-features"
}]
[{
	"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/lib/domain/profile/profile.validators.ts",
	"owner": "typescript",
	"code": "2769",
	"severity": 8,
	"message": "No overload matches this call.\n  Overload 1 of 2, '(check: (arg: { [x: string]: any; personalData?: unknown; medicalData?: unknown; emergencyContacts?: unknown; vehicleData?: unknown; status?: unknown; }) => arg is { [x: string]: any; personalData?: unknown; medicalData?: unknown; emergencyContacts?: unknown; vehicleData?: unknown; status?: unknown; }, message?: string | ... 2 more ... | undefined): ZodEffects<...>', gave the following error.\n    Argument of type '(data: { personalData?: Partial<{ name: string; surname: string; cpf: string; birthDate: string; phone: string; email: string; address: { number: string; street: string; neighborhood: string; city: string; state: string; zipCode: string; complement?: string | undefined; }; }> | undefined; vehicleData?: { ...; } | un...' is not assignable to parameter of type '(arg: { [x: string]: any; personalData?: unknown; medicalData?: unknown; emergencyContacts?: unknown; vehicleData?: unknown; status?: unknown; }) => arg is { [x: string]: any; personalData?: unknown; medicalData?: unknown; emergencyContacts?: unknown; vehicleData?: unknown; status?: unknown; }'.\n      Types of parameters 'data' and 'arg' are incompatible.\n        Type '{ [x: string]: any; personalData?: unknown; medicalData?: unknown; emergencyContacts?: unknown; vehicleData?: unknown; status?: unknown; }' is not assignable to type '{ personalData?: Partial<{ name: string; surname: string; cpf: string; birthDate: string; phone: string; email: string; address: { number: string; street: string; neighborhood: string; city: string; state: string; zipCode: string; complement?: string | undefined; }; }> | undefined; vehicleData?: { ...; } | undefined...'.\n          Types of property 'personalData' are incompatible.\n            Type 'unknown' is not assignable to type 'Partial<{ name: string; surname: string; cpf: string; birthDate: string; phone: string; email: string; address: { number: string; street: string; neighborhood: string; city: string; state: string; zipCode: string; complement?: string | undefined; }; }> | undefined'.\n  Overload 2 of 2, '(check: (arg: { [x: string]: any; personalData?: unknown; medicalData?: unknown; emergencyContacts?: unknown; vehicleData?: unknown; status?: unknown; }) => unknown, message?: string | Partial<Omit<ZodCustomIssue, \"code\">> | ((arg: { ...; }) => Partial<...>) | undefined): ZodEffects<...>', gave the following error.\n    Argument of type '(data: { personalData?: Partial<{ name: string; surname: string; cpf: string; birthDate: string; phone: string; email: string; address: { number: string; street: string; neighborhood: string; city: string; state: string; zipCode: string; complement?: string | undefined; }; }> | undefined; vehicleData?: { ...; } | un...' is not assignable to parameter of type '(arg: { [x: string]: any; personalData?: unknown; medicalData?: unknown; emergencyContacts?: unknown; vehicleData?: unknown; status?: unknown; }) => unknown'.\n      Types of parameters 'data' and 'arg' are incompatible.\n        Type '{ [x: string]: any; personalData?: unknown; medicalData?: unknown; emergencyContacts?: unknown; vehicleData?: unknown; status?: unknown; }' is not assignable to type '{ personalData?: Partial<{ name: string; surname: string; cpf: string; birthDate: string; phone: string; email: string; address: { number: string; street: string; neighborhood: string; city: string; state: string; zipCode: string; complement?: string | undefined; }; }> | undefined; vehicleData?: { ...; } | undefined...'.\n          Types of property 'personalData' are incompatible.\n            Type 'unknown' is not assignable to type 'Partial<{ name: string; surname: string; cpf: string; birthDate: string; phone: string; email: string; address: { number: string; street: string; neighborhood: string; city: string; state: string; zipCode: string; complement?: string | undefined; }; }> | undefined'.",
	"source": "ts",
	"startLineNumber": 139,
	"startColumn": 11,
	"endLineNumber": 139,
	"endColumn": 32,
	"extensionID": "vscode.typescript-language-features"
}]
[{
	"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/lib/domain/profile/profile.validators.ts",
	"owner": "typescript",
	"code": "2345",
	"severity": 8,
	"message": "Argument of type '{ brand: string; model: string; year: number; color: string; licensePlate: string; } | undefined' is not assignable to parameter of type 'Record<string, unknown>'.\n  Type 'undefined' is not assignable to type 'Record<string, unknown>'.",
	"source": "ts",
	"startLineNumber": 373,
	"startColumn": 40,
	"endLineNumber": 373,
	"endColumn": 59,
	"extensionID": "vscode.typescript-language-features"
}]
[{
	"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/lib/domain/profile/profile.validators.ts",
	"owner": "typescript",
	"code": "2769",
	"severity": 8,
	"message": "No overload matches this call.\n  Overload 1 of 3, '(callbackfn: (previousValue: string, currentValue: string, currentIndex: number, array: string[]) => string, initialValue: string): string', gave the following error.\n    Argument of type '(current: Record<string, unknown>, key: string) => unknown' is not assignable to parameter of type '(previousValue: string, currentValue: string, currentIndex: number, array: string[]) => string'.\n      Types of parameters 'current' and 'previousValue' are incompatible.\n        Type 'string' is not assignable to type 'Record<string, unknown>'.\n  Overload 2 of 3, '(callbackfn: (previousValue: Record<string, unknown>, currentValue: string, currentIndex: number, array: string[]) => Record<string, unknown>, initialValue: Record<string, unknown>): Record<...>', gave the following error.\n    Argument of type '(current: Record<string, unknown>, key: string) => unknown' is not assignable to parameter of type '(previousValue: Record<string, unknown>, currentValue: string, currentIndex: number, array: string[]) => Record<string, unknown>'.\n      Type 'unknown' is not assignable to type 'Record<string, unknown>'.",
	"source": "ts",
	"startLineNumber": 727,
	"startColumn": 33,
	"endLineNumber": 727,
	"endColumn": 52,
	"extensionID": "vscode.typescript-language-features"
}]