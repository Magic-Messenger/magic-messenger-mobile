import {AppLayout, ContactHeader, EmptyList} from "@/components";
import {spacingPixel} from "@/utils";
import {FlatList} from "react-native";
import {useListContact} from "../hooks";

export default function ContactsScreen() {
    const {
        t,
        styles,
        isLoading,
        filteredData,
        setSearchText,
        displayOnlyBlocked,
        setDisplayOnlyBlocked,
        renderContactItem
    } = useListContact()

    return (
        <AppLayout container title={t("contacts.title")} loading={isLoading}>
            <FlatList
                ListHeaderComponent={
                    <ContactHeader setSearchText={(_text) => setSearchText(_text)}
                                   onBlockedPress={() => setDisplayOnlyBlocked(!displayOnlyBlocked)}
                                   isBlocked={displayOnlyBlocked}/>
                }
                data={filteredData}
                contentContainerStyle={{gap: spacingPixel(10)}}
                keyExtractor={(_, index) => index?.toString()}
                renderItem={renderContactItem}
                ListEmptyComponent={
                    <EmptyList
                        label={t("contacts.notFound")}
                        icon="frown"
                        style={styles.mt10}
                    />
                }
            />
        </AppLayout>
    );
}
