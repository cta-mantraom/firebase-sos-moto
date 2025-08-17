[{
	"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/api/processors/email-sender.ts",
	"owner": "typescript",
	"code": "2345",
	"severity": 8,
	"message": "Argument of type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; } | { ...; } | { ...; }' is not assignable to parameter of type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; } & { ...; } & { ...; }'.\n  Type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; }' is not assignable to type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; } & { ...; } & { ...; }'.\n    Property 'reason' is missing in type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; }' but required in type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; reason: string; retryUrl?: string | undefined; }'.",
	"source": "ts",
	"startLineNumber": 368,
	"startColumn": 47,
	"endLineNumber": 368,
	"endColumn": 121,
	"relatedInformation": [
		{
			"startLineNumber": 46,
			"startColumn": 3,
			"endLineNumber": 46,
			"endColumn": 21,
			"message": "'reason' is declared here.",
			"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/lib/domain/notification/email.types.ts"
		}
	],
	"extensionID": "vscode.typescript-language-features"
}]
[{
	"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/api/processors/email-sender.ts",
	"owner": "typescript",
	"code": "2345",
	"severity": 8,
	"message": "Argument of type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; } | { ...; } | { ...; }' is not assignable to parameter of type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; } & { ...; } & { ...; }'.\n  Type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; }' is not assignable to type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; } & { ...; } & { ...; }'.\n    Property 'reason' is missing in type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; }' but required in type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; reason: string; retryUrl?: string | undefined; }'.",
	"source": "ts",
	"startLineNumber": 369,
	"startColumn": 47,
	"endLineNumber": 369,
	"endColumn": 121,
	"relatedInformation": [
		{
			"startLineNumber": 46,
			"startColumn": 3,
			"endLineNumber": 46,
			"endColumn": 21,
			"message": "'reason' is declared here.",
			"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/lib/domain/notification/email.types.ts"
		}
	],
	"extensionID": "vscode.typescript-language-features"
}]
[{
	"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/api/processors/email-sender.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "Type '{ planType: \"basic\" | \"premium\"; memorialUrl: string; paymentId?: string | undefined; amount?: number | undefined; qrCodeUrl?: string | undefined; userName: string; userEmail: string; timestamp: Date; }' is not assignable to type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; } | { ...; } | ... 5 more ... | undefined'.\n  Type '{ planType: \"basic\" | \"premium\"; memorialUrl: string; paymentId?: string | undefined; amount?: number | undefined; qrCodeUrl?: string | undefined; userName: string; userEmail: string; timestamp: Date; }' is not assignable to type '{ userName: string; userEmail: string; timestamp: Date; paymentId: string; amount: number; planType: \"basic\" | \"premium\"; memorialUrl: string; qrCodeUrl?: string | undefined; }'.\n    Types of property 'paymentId' are incompatible.\n      Type 'string | undefined' is not assignable to type 'string'.\n        Type 'undefined' is not assignable to type 'string'.",
	"source": "ts",
	"startLineNumber": 376,
	"startColumn": 7,
	"endLineNumber": 376,
	"endColumn": 19,
	"relatedInformation": [
		{
			"startLineNumber": 134,
			"startColumn": 3,
			"endLineNumber": 134,
			"endColumn": 15,
			"message": "The expected type comes from property 'templateData' which is declared here on type 'Partial<EmailData>'",
			"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/lib/domain/notification/email.types.ts"
		}
	],
	"extensionID": "vscode.typescript-language-features"
}]