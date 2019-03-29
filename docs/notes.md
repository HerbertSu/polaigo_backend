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

# Zip Code Notes
## **Types:**

There are four types of ZIP codes: 

1. Unique: assigned to a single high-volume address
2. Post Office Box only: used only for PO Boxes at a given facility, not for any other type of delivery
3. Military: used to route mail for the U.S. military
4. Standard: all other ZIP codes

## **Primary State Prefixes:**

ZIP codes are numbered with the first digit representing a certain group of U.S. states, the second and third digits together representing a region in that group (or perhaps a large city), and the fourht and fifth digits representing a group of delviery addresses within that region. The main town in a region (if applicable) often gets the first ZIP codes for that region; afterward, the numerical order often follows the alphabetical order.

In general, the first three digits designate a sectional center facility (SFC), the mail sorting and distribution center for an area. A SFC may have more than one three-digit code assigned to it. In some cases, a SFC may serve an area in an adjacent state, usually due to the lack of a proper location for a center in that region. 

In terms of geographic location, many of the lowest ZIP codes, which begin with '0', are in the New England region. The numbers increase southward along the East Coast. From here, the numbers increase heading westward and northward east of the Mississippi River, southward west of the Mississippi River, and northward on the West Coast.

The first digit of ZIP Codes is allocated as follows:

**0** : CT, MA, ME, NH, NJ, NY (Fishers Island only), PR, RI, VT, VI

**1** : DE, NY, PA

**2** : DC, MD, NC, SC, VA, WV

**3** : AL, FL, GA, MS,TN

**4** : IN, KY, MI, OH

**5** : IA, MN, MT, ND, SD, WI

**6** : IL, KS, MO, NE

**7** : AR, LA, OK, TX

**8** : AZ, CO, ID, NM, NV, UT, WY

**9** : AK, AS, CA, GU, HI, MH, FM, MP, OR, OW, WA
            

The next two digits represent the sectional center facility (SFC) (eg. 477xx = Vanderburg County, Indiana), and the fourth and fifth digits represent the area of the city (if it is in a metropolitan area), or a village/town (outside of metro areas). Thus, 47722 (4 = Indiana, 77 = Vandeburg County, 22 = University of Evansville area).

Despite the geographic derivation of most ZIP codes, the codes themselves do not represent geographic regions; in general, they correspond to address groups or delivery routes. As a result, ZIP code "areas" can overlap, be subsets of each other, or be artificial constructs with no geographic area (such as 095 for mail to the Navy, which is not geographically fixed). 

In rare circumstances, a locality is assigned a ZIP code that does not match the rest of the state. In even rarer cases, a ZIP code may cross state lines. Usually, this occurs when the locality is so isolated that it is most conveniently served from a sectional center in another state.

## **Implementation**
Use Google's Civic Info API to get a user's district from an address. To use their representativeInfoByAddress functionality, send a GET request to:

https://www.googleapis.com/civicinfo/v2/representatives/?address=[Address given as a string]&key=[API Key raw w/o quotes]

If successful, a JSON object with civic information related to the given address will be returned.