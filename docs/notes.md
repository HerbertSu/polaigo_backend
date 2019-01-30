# CREC URL Manipulations
Govinfo uses two key pieces of information to construct predictable URLs to documents and Details pages:
1. the Package ID is used to identify an individual issue of the publication. They follow the form
    - CREC-{Publication Date in YYYY-MM-DD} 
    - CREC-2010-09-28

2. the Granule ID for the CREC is used to identify the specific document within an issue of the publication. There are many forms depending on what you want
    - Individual Documents
        - CREC-{Package ID}-pt{Part Number}-Pg{Page Prefix (ie D, H, S, E)}{Page Number}-{Sequence Number}
            - Page Number is the first number for the document
            - Sequence Number is not used when there is more than 1 document that starts on the same page. Sequence Number is not used for the first document on a page
        - CREC-2010-09-28-pt1-PgH7019
        - CREC-2010-09-28-pt1-PgH7019-2
        - CREC-2011-01-07-pt1-PgD15-5
    - Complete Sections
        - Entire Book
            - CREC-{Package ID}
        - House
            - CREC-{Package ID}-house
        - Senate
            - CREC-{Package ID}-senate
        - Daily Digest
            - CREC-{Package ID}-dailydigest
        - Extensions of Remarks
            - CREC-{Package ID}-extensions
                    

URLs for packages need to follow  
&nbsp;&nbsp;&nbsp;&nbsp;``` https://www.govinfo.gov/packages/... ```

URLs for granules need to follow  
&nbsp;&nbsp;&nbsp;&nbsp;``` https://www.govinfo.gov/metadata/granule/... ```

CREC pages are numbered sequentially throughout the session of Congress. Each CREC consists of 4 sections:
- Daily Digest
- House section
- Senate section
- Extension of Remarks

Each Daily Digest page begins with the letter D and appears in the format D1234. 

Each House page begins with the letter H and appears in the format H1234.

Each Senate page begins with the letter S and appears in the format S1234.

Each Extension of Remarks page begins with the letter E and appears in the formate E1234.

Each new CREC subject begins in a relatedItem object.

All tags in a level are lumped together regardless of their ordering in the xml file.

**Parsing Method:**

1. Go to whole Congressional Record
2. Filter out daily digest htm links for House and Senate
3. From the htm links, filter out the measures that were passed and not
    - House:
        - "Suspensions: The House agreed to suspend the rules and pass the following measures:"
        - "Suspensions: The House failed to agree to suspend the rules and pass the following measures:"
    - Senate:
        - Measures Passed:
        - **not passed keywords TBD
    - Save the short descriptions and page numbers 
            


       