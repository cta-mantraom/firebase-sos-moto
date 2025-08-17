[{
	"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/api/processors/final-processor.ts",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "Type 'string | undefined' is not assignable to type 'BloodType'.\n  Type 'undefined' is not assignable to type 'BloodType'.",
	"source": "ts",
	"startLineNumber": 202,
	"startColumn": 9,
	"endLineNumber": 202,
	"endColumn": 18,
	"relatedInformation": [
		{
			"startLineNumber": 49,
			"startColumn": 3,
			"endLineNumber": 49,
			"endColumn": 37,
			"message": "The expected type comes from property 'bloodType' which is declared here on type '{ bloodType: BloodType; allergies: string[]; medications: string[]; medicalConditions: string[]; organDonor: boolean; emergencyNotes?: string | undefined; }'",
			"resource": "/c:/Users/User/Desktop/Projetos/sos-moto/cta-mantraom/opus4/firebase-sos-moto/lib/domain/profile/profile.types.ts"
		}
	],
	"extensionID": "vscode.typescript-language-features"
}]

The expected type comes from property 'bloodType' which is declared here on type '{ bloodType: BloodType; allergies: string[]; medications: string[]; medicalConditions: string[]; organDonor: boolean; emergencyNotes?: string | undefined; }'