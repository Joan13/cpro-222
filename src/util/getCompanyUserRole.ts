import { strings } from "../lang/lang";
import { TCompany } from "../types/types";

/**
 * Get role information from level and company category
 * @param level - The access level number
 * @param companyCategory - The company category number (1-18)
 * @returns Object with role, abbreviated, and service_name info, or null if not found
 */
export const getCompanyUserRole = (level: number, companyCategory: number): { role: string; abbreviated: string | null; service_name: string; service_name_abb: string } | null => {
    // Map company category to company_roles key
    const getCompanyRolesKey = (category: number): string => {
        const mapping: { [key: number]: string } = {
            1: "retail",
            2: "manufacturing",
            3: "healthcare",
            4: "technology",
            5: "finance",
            6: "education",
            7: "hospitality",
            8: "real_estate",
            9: "entertainment",
            10: "transportation",
            11: "energy",
            12: "agriculture",
            13: "fashion_textile",
            14: "communication_media",
            15: "food_beverages",
            16: "business_services",
            17: "biotechnology",
            18: "telecommunications"
        };
        return mapping[category] || "education";
    };

    const rolesKey = getCompanyRolesKey(companyCategory);
    const allRoles = (strings.company_roles as any)?.[rolesKey] || [];
    
    const roleData = allRoles.find((r: any) => r.level === level);
    
    if (!roleData) {
        return null;
    }

    return {
        role: roleData.role || "",
        abbreviated: roleData.abbreviated || null,
        service_name: roleData.role || "",
        service_name_abb: roleData.abbreviated || ""
    };
};
