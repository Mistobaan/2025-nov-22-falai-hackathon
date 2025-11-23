# Blueprint Creation

This is a complex task that sits right at the intersection of data management and generative AI. A "blueprint" implies defining the *potential* for defects, not just labeling existing ones.

To make this a "guided tutorial," the UI needs to hold the user's hand through a structured process. We will use a **Wizard (Stepper) Interface** that culminates in the requested grid view.

Here is a design proposal for the **"Defect Blueprint Builder"** module.

-----

### UI Overview & Philosophy

  * **The Goal:** Teach the system what "normal" looks like, tell it what "broken" is called, and have the system generate examples of "broken" for approval.
  * **The Persona:** An industrial engineer or QA lead who knows the products physically but isn't an AI expert.
  * **The Flow:**
    1.  **Acquire Context:** Upload reference (golden) objects.
    2.  **Define Ontology:** List the types of defects that *can* happen.
    3.  **Synthesize & Verify:** The system generates an example of every defect on every object. The user reviews them.
    4.  **Final Blueprint:** The resulting grid view.

-----

### The Guided Tutorial (Wizard UI)

#### Screen 1: The Setup Wizard - Step 1 (Upload)

**Header:**
[ Create Defect Blueprint ]
**Progress Bar:** [ **(1) Upload Reference Objects** ] \> [ (2) Define Categories ] \> [ (3) Generate & Review ] \> [ (4) Final Blueprint ]

**Main Content Area:**

> **👋 Welcome to the Blueprint Builder.**
>
> To teach the AI about defects, we first need to show it what your objects look like when they are perfectly normal.
>
> **Action: Upload 1 or more "Golden State" images representing different objects or viewpoints.**

```markdown
+-------------------------------------------------------+
|                                                       |
|   [ ICON: Cloud Upload ]                              |
|   **Drag and drop image files here** |
|   or [Browse Files]                                   |
|   *(supports JPG, PNG. Recommended high resolution)* |
|                                                       |
+-------------------------------------------------------+

**Uploaded Objects (3):**
+-----------+  +-----------+  +-----------+
| [Img:     |  | [Img:     |  | [Img:     |
|  Metal    |  |  Plastic  |  |  Glass    |
|  Gear_A]  |  |  Case_B]  |  |  Lens_C]  |
| [x]Remove |  | [x]Remove |  | [x]Remove |
+-----------+  +-----------+  +-----------+
```

**Footer Navigation:**
[ \< Back ] [ **Next: Define Categories \>** ]

-----

#### Screen 2: The Setup Wizard - Step 2 (Ontology)

**Header:**
[ Create Defect Blueprint ]
**Progress Bar:** [ (1) Upload ] \> [ **(2) Define Defect Categories** ] \> [ (3) Generate & Review ] \> [ (4) Final Blueprint ]

**Main Content Area:**

> **What can go wrong?**
>
> Now, list the abstract categories of defects that apply to these objects. Don't worry about what they look like yet, just name them.

```markdown
**Defect Ontology List**

> **✨ AI Suggestions:**
> Based on the uploaded images, we detected these potential defects:
> *   [+] **Misaligned Label** (Confidence: High)
> *   [+] **Scratches on Casing** (Confidence: Medium)
> *   [+] **Bent Contacts** (Confidence: Medium)
>
> *Click [+] to add to your list.*

[ Input Field: Type defect name (e.g., "Crack") ] [ + Add Category ]

-------------------------
| 1. Surface Scratch    | [Delete icon]
| 2. Impact Dent        | [Delete icon]
| 3. Rust Patch         | [Delete icon]
-------------------------

> *Tip: Try to keep categories distinct. A "scratch" is different from a "crack".*
```

**Footer Navigation:**
[ \< Back ] [ **Next: Generate Examples \>** ]

-----

#### Screen 3: The Setup Wizard - Step 3 (The Crux)

This is the most critical step. The system takes the cross-product of (Objects x Defects) and attempts to generate a synthetic example of each. The user acts as the reviewer.

**Header:**
[ Create Defect Blueprint ]
**Progress Bar:** [ (1) Upload ] \> [ (2) Categories ] \> [ **(3) Generate & Review** ] \> [ (4) Final Blueprint ]

**Main Content Area:**

> **Reviewing the Blueprint Draft**
>
> We have generated a synthetic example for every combination of object and defect category.
>
> **Action: Review the grid below. If an image accurately represents the defect, mark it as "Approved". If not, click it to regenerate or refine.**

```markdown
**Blueprint Draft Matrix (Click cells to refine)**

| Object Baseline | Defect: Surface Scratch | Defect: Impact Dent | Defect: Rust Patch |
| :--- | :--- | :--- | :--- |
| **Metal Gear_A** | [IMAGE: Gear with realistic scratch] <br> [ (v) Approved ] | [IMAGE: Gear with dent] <br> [ ( ) Needs Work ] | [IMAGE: Gear with rust] <br> [ (v) Approved ] |
| **Plastic Case_B** | [IMAGE: Case with scratch] <br> [ (v) Approved ] | [IMAGE: Case with dent] <br> [ (v) Approved ] | [IMAGE: Case with rust] <br> [ ( ) Needs Work - *Plastic doesn't rust* ] |
| **Glass Lens_C** | [IMAGE: Lens with scratch] <br> [ (v) Approved ] | [IMAGE: Lens with chip] <br> [ (v) Approved ] | [IMAGE: Lens with rust] <br> [ ( ) Needs Work - *Glass doesn't rust* ] |

------------------------------------------
*Progress: 7 of 9 combinations approved.*
```

**(Side Panel - Appears when a "Needs Work" cell is clicked, e.g., Plastic Case + Rust):**

```markdown
**Refining Cell: Plastic Case_B / Rust Patch**

> The AI generated rust on plastic. Is this possible for your use case?

[IMAGE PREVIEW of the bad generation]

**Actions:**
[ (o) **Mark as Impossible** (This combination cannot exist) ]
[ ( ) **Regenerate** (Try again with different parameters) ]
[ ( ) **Manual Override** (Upload my own example image) ]

[ Save Change ]
```

**Footer Navigation:**
*(Button is disabled until all cells are Approved or marked Impossible)*
[ \< Back ] [ **Finish: Finalize Blueprint \>** ]

-----

#### Screen 4: The Final Output (The Request)

This is the final screen after the tutorial is complete. It is a static, referenceable view.

**Header:**
**Project Dashboard / Defect Blueprints / V1.0 RELEASE**

**Main Content Area (The Grid View):**

> **✅ Blueprint Successfully Created\!**
>
> Below is the master reference grid for your objects. This blueprint will be used to train the anomaly detection models.

```markdown
+-----------------------------------------------------------------------------------+
|  **BLUEPRINT MATRIX V1.0** |
|  *Export PDF | Share Link* |
+-----------------------------------------------------------------------------------+
|                  | **SURFACE SCRATCH** | **IMPACT DENT** | **RUST PATCH** |
+------------------+---------------------+--------------------+---------------------+
| **METAL GEAR_A** | [ Final Image:      | [ Final Image:     | [ Final Image:      |
| (Reference)      |   Gear + Scratch ]  |   Gear + Dent ]    |   Gear + Rust ]     |
+------------------+---------------------+--------------------+---------------------+
| **PLASTIC CASE_B**| [ Final Image:      | [ Final Image:     | N/A                 |
| (Reference)      |   Case + Scratch ]  |   Case + Dent ]    | (Marked Impossible) |
+------------------+---------------------+--------------------+---------------------+
| **GLASS LENS_C** | [ Final Image:      | [ Final Image:     | N/A                 |
| (Reference)      |   Lens + Scratch ]  |   Lens + Chip ]    | (Marked Impossible) |
+------------------+---------------------+--------------------+---------------------+
```