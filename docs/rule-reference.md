# Rule reference

| Rule family | Purpose |
| --- | --- |
| `AR-CONFIG-*` | Shopify configuration and deployment URL signals |
| `AR-COMPLIANCE-*` | Mandatory compliance webhook configuration and handler review |
| `AR-WEBHOOK-*` | HMAC, raw-body, timing-safe comparison, and duplicate delivery review |
| `AR-AUTH-*` | Embedded authentication and credential safety |
| `AR-SECURITY-*` | Obvious secrets and dynamic execution review |
| `AR-API-*` | Submission-specific API review signals; migration work belongs to Upgrade Guard |
| `AR-BILLING-*` | Billing lifecycle review signals |
| `AR-DATA-*` | Protected customer-data review signals |
| `AR-LISTING-*` | Optional listing manifest and external manual checks |
| `AR-REVIEW-*` | Unknown or unsupported static patterns |

Rule IDs are stable once published. New rules are additive; detector confidence may become more conservative when evidence changes.
